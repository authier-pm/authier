package dev.authier.android

import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import java.time.Instant
import java.util.UUID
import javax.crypto.SecretKey

data class VaultUiState(
    val email: String = "",
    val serverUrl: String = "https://api.authier.pm",
    val remembered: Boolean = false,
    val unlocked: Boolean = false,
    val busy: Boolean = false,
    val demo: Boolean = false,
    val offline: Boolean = false,
    val error: String? = null,
    val notice: String? = null,
    val pendingApproval: Boolean = false,
    val items: List<VaultItem> = emptyList(),
    val devices: List<DeviceInfo> = emptyList(),
    val approvals: List<ApprovalInfo> = emptyList(),
    val security: SecurityInfo = SecurityInfo(),
    val pendingWrites: Int = 0,
    val writes: List<PendingWrite> = emptyList(),
    val lastSyncAt: Long? = null,
    val lockTimeoutSeconds: Int = 300,
    val lockGeneration: Int = 0,
)

class VaultViewModel(application: Application) : AndroidViewModel(application) {
    private val store = VaultStore(application)
    private var snapshot = store.read()
    private var masterKey: SecretKey? = null
    private var activeJob: Job? = null
    private var actionGeneration = 0
    private var lastInteraction = System.currentTimeMillis()
    private val state = MutableStateFlow(VaultUiState(email = snapshot.email, serverUrl = snapshot.serverUrl,
        remembered = snapshot.authSecretEncrypted.isNotBlank(), pendingWrites = snapshot.outbox.size,
        lastSyncAt = snapshot.lastSyncAt, lockTimeoutSeconds = snapshot.lockTimeoutSeconds))
    val ui = state.asStateFlow()

    init {
        viewModelScope.launch {
            while (true) {
                delay(1000)
                val timeout = state.value.lockTimeoutSeconds
                if (state.value.unlocked && !state.value.demo && timeout > 0 && System.currentTimeMillis() - lastInteraction >= timeout * 1000L) lock()
            }
        }
    }

    fun touch() { lastInteraction = System.currentTimeMillis() }
    fun clearMessage() { state.value = state.value.copy(error = null, notice = null) }

    private fun action(work: suspend () -> Unit) {
        if (activeJob?.isActive == true) return
        val predecessor = activeJob
        val generation = ++actionGeneration
        activeJob = viewModelScope.launch {
            // A canceled disk write must finish before a fresh unlock reads its snapshot.
            predecessor?.join()
            state.value = state.value.copy(busy = true, error = null, notice = null)
            // The UI boundary converts transport/crypto errors into visible, actionable feedback.
            try { work() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) {
                val message = when (error) {
                    is javax.crypto.AEADBadTagException -> "That master password could not unlock this vault."
                    is java.net.UnknownHostException, is java.net.ConnectException, is java.net.SocketTimeoutException -> "You are offline or the server is unavailable. Your encrypted changes are saved on this device."
                    else -> error.message ?: "The operation could not be completed. Please try again."
                }
                if (generation == actionGeneration) state.value = state.value.copy(error = message,
                    offline = error is java.net.UnknownHostException || error is java.net.ConnectException || error is java.net.SocketTimeoutException)
            } finally { if (generation == actionGeneration) state.value = state.value.copy(busy = false) }
        }
    }

    private suspend fun persist(next: VaultSnapshot) {
        check(!state.value.demo) { "Demo mode never writes to a real vault." }
        withContext(Dispatchers.IO) { store.write(next) }
        snapshot = next
        state.value = state.value.copy(pendingWrites = next.outbox.size, writes = next.outbox, lastSyncAt = next.lastSyncAt, lockTimeoutSeconds = next.lockTimeoutSeconds)
    }

    private suspend fun rebuildItems() {
        val key = masterKey ?: return
        val pending = snapshot.outbox.associateBy { it.id }
        val results = withContext(Dispatchers.Default) {
            snapshot.secrets.filter(::isVisibleInNativeVault).map { record ->
                runCatching {
                    val plaintext = AuthierCrypto.decrypt(key, record.encrypted)
                    VaultItem(record, SecretContentDecoder.decode(plaintext, record.kind), pending[record.id] != null, pending[record.id]?.conflict == true)
                }
            }
        }
        val corrupt = results.count { it.isFailure }
        state.value = state.value.copy(items = results.mapNotNull { it.getOrNull() }.sortedBy { it.content.label.lowercase() },
            error = if (corrupt > 0) "$corrupt encrypted item(s) could not be opened. Their ciphertext is preserved; inspect them on another Authier device." else state.value.error)
    }

    fun authenticate(email: String, password: String, serverUrl: String, register: Boolean) = action {
        require(email.contains('@')) { "Enter a valid email address." }
        require(password.isNotEmpty()) { "Enter your master password." }
        if (register) require(password.length >= 12) { "Use a master password with at least 12 characters." }
        val origin = serverUrl.trim().trimEnd('/')
        val parsed = java.net.URI(origin)
        require(parsed.scheme == "https" || (BuildConfig.DEBUG && parsed.scheme == "http")) { "Use an HTTPS server address." }
        require(!parsed.host.isNullOrBlank() && parsed.rawUserInfo == null && parsed.rawQuery == null && parsed.rawFragment == null) { "Enter the server origin, such as https://api.authier.pm." }
        val api = ApiFacade(origin)
        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
        val normalizedEmail = email.trim().lowercase()
        require(snapshot.outbox.isEmpty() || (snapshot.email == normalizedEmail && snapshot.serverUrl == origin)) { "Reconnect to your existing account and sync its pending changes first." }
        // Persist only the stable device identity until authentication succeeds. Existing tokens
        // must never become associated with an unverified server origin or different account.
        persist(snapshot)
        val salt: String
        val key: SecretKey
        val session: AuthSession
        val encryptedAuthSecret: String
        if (register) {
            salt = AuthierCrypto.generateSalt()
            key = withContext(Dispatchers.Default) { AuthierCrypto.deriveMasterKey(password, salt) }
            val secret = AuthierCrypto.createDeviceSecret(key, salt)
            encryptedAuthSecret = secret.addDeviceSecretEncrypted
            session = api.register(normalizedEmail, UUID.randomUUID().toString(), snapshot.deviceId, deviceName,
                DeviceSecretInput(secret.addDeviceSecret, secret.addDeviceSecretEncrypted, salt))
        } else {
            val challenge = api.challenge(normalizedEmail, snapshot.deviceId, deviceName)
            if (challenge.status != "approved") {
                state.value = state.value.copy(pendingApproval = true, notice = "Approve this Android device from an existing Authier device, then check again.")
                return@action
            }
            salt = requireNotNull(challenge.encryptionSalt)
            key = withContext(Dispatchers.Default) { AuthierCrypto.deriveMasterKey(password, salt) }
            if (snapshot.outbox.isNotEmpty()) {
                require(snapshot.encryptionSalt == salt) { "Pending changes use the previous account key. Resolve them before switching keys." }
                AuthierCrypto.decrypt(key, snapshot.authSecretEncrypted)
            }
            val currentSecret = AuthierCrypto.decrypt(key, requireNotNull(challenge.addDeviceSecretEncrypted))
            val secret = AuthierCrypto.createDeviceSecret(key, salt)
            encryptedAuthSecret = secret.addDeviceSecretEncrypted
            session = api.completeLogin(challenge.challengeId, currentSecret, DeviceSecretInput(secret.addDeviceSecret, secret.addDeviceSecretEncrypted, salt))
        }
        val sealed = withContext(Dispatchers.IO) { store.sealTokens(session.tokens) }
        val pending = snapshot.outbox
        require(pending.isEmpty() || snapshot.encryptionSalt == salt) { "The account encryption key changed. This phone still has pending changes encrypted with the previous key." }
        val pendingIds = pending.map { it.id }.toSet()
        val records = session.bootstrap.secrets.filter { it.id !in pendingIds } + snapshot.secrets.filter { it.id in pendingIds }
        persist(snapshot.copy(email = normalizedEmail, serverUrl = origin, encryptionSalt = salt, authSecretEncrypted = encryptedAuthSecret,
            sealedTokens = sealed, cursor = null, secrets = records, outbox = pending, lockTimeoutSeconds = session.bootstrap.lockTimeoutSeconds))
        masterKey = key
        touch()
        state.value = state.value.copy(email = normalizedEmail, serverUrl = origin, remembered = true, unlocked = true, pendingApproval = false, approvals = session.bootstrap.approvals)
        rebuildItems()
        syncNow()
    }

    fun unlock(password: String) = action {
        snapshot = withContext(Dispatchers.IO) { store.read() }
        if (snapshot.authSecretEncrypted.isBlank()) {
            masterKey = null
            state.value = VaultUiState()
            return@action
        }
        val key = withContext(Dispatchers.Default) { AuthierCrypto.deriveMasterKey(password, snapshot.encryptionSalt) }
        AuthierCrypto.decrypt(key, snapshot.authSecretEncrypted)
        masterKey = key
        touch()
        state.value = state.value.copy(unlocked = true)
        rebuildItems()
        syncNow()
    }

    fun lock() {
        if (state.value.demo) return
        actionGeneration++
        activeJob?.cancel()
        masterKey = null
        state.value = state.value.copy(unlocked = false, items = emptyList(), devices = emptyList(), approvals = emptyList(), busy = false, error = null, notice = null, lockGeneration = state.value.lockGeneration + 1)
    }

    fun reconnect() {
        lock()
        state.value = state.value.copy(remembered = false, notice = "Sign in again to reconnect. Encrypted pending changes stay on this device.")
    }

    fun sync() = action { syncNow() }

    private suspend fun <T> authenticated(block: suspend (VaultApi) -> T): T {
        check(!state.value.demo) { "Demo mode does not connect to the server." }
        val tokens = withContext(Dispatchers.IO) { store.openTokens(snapshot.sealedTokens) }
            ?: throw IllegalStateException("Your server session expired. Sign out and sign in again to reconnect.")
        val api = ApiFacade(snapshot.serverUrl, currentDeviceId = snapshot.deviceId).apply { accessToken = tokens.accessToken }
        return try { block(api) }
        catch (error: ApiFailure) {
            if (error.status != 401) throw error
            val refreshed = api.refresh(tokens.refreshToken)
            val sealed = withContext(Dispatchers.IO) { store.sealTokens(refreshed) }
            persist(snapshot.copy(sealedTokens = sealed))
            api.accessToken = refreshed.accessToken
            block(api)
        } finally { api.accessToken = null }
    }

    private suspend fun syncNow() {
        if (state.value.demo) { state.value = state.value.copy(notice = "Demo vault is ready to explore."); return }
        authenticated { api ->
            snapshot.outbox.filter { !it.conflict }.forEach { operation ->
                try {
                    val saved = api.write(operation)
                    val records = snapshot.secrets.filter { it.id != saved.id } + saved
                    persist(snapshot.copy(secrets = records, outbox = snapshot.outbox.filter { it.operationId != operation.operationId }))
                } catch (error: ApiFailure) {
                    if (error.status != 409) throw error
                    persist(snapshot.copy(outbox = snapshot.outbox.map { if (it.operationId == operation.operationId) it.copy(conflict = true) else it }))
                }
            }
            var more: Boolean
            do {
                val page = try { api.sync(snapshot.cursor) }
                catch (error: ApiFailure) {
                    if (error.code != "CURSOR_INVALID" || snapshot.cursor == null) throw error
                    // Policy/account cursor invalidation requires replay; keep unsent local ciphertext.
                    val pendingIds = snapshot.outbox.map { it.id }.toSet()
                    persist(snapshot.copy(cursor = null, secrets = snapshot.secrets.filter { it.id in pendingIds }))
                    api.sync(null)
                }
                persist(applySyncPage(snapshot, page.changes, page.nextCursor))
                more = page.hasMore
            } while (more)
            persist(snapshot.copy(lastSyncAt = System.currentTimeMillis()))
        }
        rebuildItems()
        val conflicts = snapshot.outbox.count { it.conflict }
        state.value = state.value.copy(offline = false, notice = if (conflicts > 0) "$conflicts change(s) need your review. Open the item to resolve the conflict." else "Your vault is up to date.")
    }

    fun saveItem(id: String?, kind: String, content: SecretContent) = action {
        requireNativeEditableKind(kind)
        require(content.label.isNotBlank()) { "Give this item a name." }
        if (kind == "LOGIN_CREDENTIALS") require(content.password.isNotBlank() && content.username.isNotBlank()) { "Enter a username and password." }
        if (kind == "TOTP") {
            require(content.algorithm == "SHA1") { "Use SHA1 codes for compatibility with the other Authier apps." }
            dev.authier.android.crypto.Totp.generate(content.secret, content.algorithm, content.digits, content.period)
        }
        require(snapshot.outbox.none { it.id == id }) { "Sync or resolve this item's pending change before editing it again." }
        val itemId = id ?: UUID.randomUUID().toString()
        if (state.value.demo) {
            val record = SecretRecord(itemId, "demo", kind, 1, Instant.now().toString())
            state.value = state.value.copy(items = (state.value.items.filter { it.record.id != itemId } + VaultItem(record, content)).sortedBy { it.content.label })
            return@action
        }
        val old = id?.let { existingId ->
            requireNotNull(snapshot.secrets.find { it.id == existingId }) { "This item is no longer in the local vault. Sync before editing it again." }
                .also { requireNativeEditableKind(it.kind) }
        }
        val encrypted = AuthierCrypto.encrypt(requireNotNull(masterKey), vaultJson.encodeToString(content), snapshot.encryptionSalt)
        val record = SecretRecord(itemId, encrypted, kind, old?.version ?: 1, old?.createdAt ?: Instant.now().toString(), Instant.now().toString())
        val write = PendingWrite(operation = if (id == null) "create" else "update", id = itemId, expectedVersion = old?.version, encrypted = encrypted, kind = kind)
        persist(snapshot.copy(secrets = snapshot.secrets.filter { it.id != itemId } + record, outbox = snapshot.outbox + write))
        rebuildItems()
        syncNow()
    }

    fun deleteItem(id: String) = action {
        if (state.value.demo) { state.value = state.value.copy(items = state.value.items.filter { it.record.id != id }); return@action }
        require(snapshot.outbox.none { it.id == id }) { "Sync or resolve this item's pending change before deleting it." }
        val record = requireNotNull(snapshot.secrets.find { it.id == id })
        requireNativeEditableKind(record.kind)
        persist(snapshot.copy(secrets = snapshot.secrets.filter { it.id != id }, outbox = snapshot.outbox + PendingWrite(operation = "delete", id = id, expectedVersion = record.version)))
        rebuildItems()
        syncNow()
    }

    fun discardLocalChange(id: String) = action {
        // Replaying from the beginning recovers the latest remote record, including deletion.
        persist(snapshot.copy(cursor = null, secrets = snapshot.secrets.filter { it.id != id }, outbox = snapshot.outbox.filter { it.id != id }))
        rebuildItems()
        syncNow()
    }

    fun loadDevices() = action {
        if (state.value.demo) return@action
        authenticated { api ->
            // Approval actions must remain available if optional device metadata cannot load.
            state.value = state.value.copy(approvals = api.approvals())
            state.value = state.value.copy(security = api.security())
            state.value = state.value.copy(devices = api.devices())
        }
    }

    fun decideApproval(id: Int, approve: Boolean) = action {
        authenticated { api -> if (approve) api.approve(id) else api.reject(id); state.value = state.value.copy(approvals = api.approvals()) }
    }

    fun removeDevice(id: String) = action {
        authenticated { api -> api.removeDevice(id); state.value = state.value.copy(devices = api.devices()) }
    }

    fun changePolicy(policy: String) = action {
        authenticated { api -> state.value = state.value.copy(security = api.updatePolicy(policy)) }
    }

    fun changeTimeout(seconds: Int) = action {
        if (!state.value.demo) {
            authenticated { it.updateLockTimeout(seconds) }
            persist(snapshot.copy(lockTimeoutSeconds = seconds))
        } else state.value = state.value.copy(lockTimeoutSeconds = seconds)
    }

    fun signOut() = action {
        if (state.value.demo) {
            state.value = VaultUiState(email = snapshot.email, serverUrl = snapshot.serverUrl, remembered = snapshot.authSecretEncrypted.isNotBlank(),
                pendingWrites = snapshot.outbox.size, writes = snapshot.outbox, lastSyncAt = snapshot.lastSyncAt, lockTimeoutSeconds = snapshot.lockTimeoutSeconds)
            return@action
        }
        require(snapshot.outbox.isEmpty()) { "Sync or resolve your pending changes before removing this vault from the device." }
        val revoked = runCatching { authenticated { it.logout() } }
        revoked.exceptionOrNull()?.let { if (it is CancellationException) throw it }
        withContext(Dispatchers.IO) { store.clear() }
        snapshot = VaultSnapshot()
        masterKey = null
        state.value = VaultUiState(notice = if (revoked.isFailure) "Local vault removed. The server could not confirm sign-out; you can revoke this device from another Authier app." else null)
    }

    fun demo() {
        if (!BuildConfig.DEBUG) return
        actionGeneration++
        activeJob?.cancel()
        masterKey = null
        val names = listOf("Linear" to "alex@studio.design", "GitHub" to "alexmorgan", "Figma" to "alex@studio.design", "Google" to "alex.morgan@gmail.com")
        val passwords = names.mapIndexed { index, (label, username) -> VaultItem(SecretRecord("demo-$index", "demo", "LOGIN_CREDENTIALS", 1, "2026-09-01T12:00:00Z"), SecretContent(label = label, username = username, password = "demo-password-" + index, url = "https://${label.lowercase()}.com")) }
        val demoSeeds = listOf("JBSWY3DPEHPK3PXP", "KRUGS4ZANFZSAYJA", "MFRGGZDFMZTWQ2LK")
        val codes = listOf("GitHub", "Google", "Cloudflare").mapIndexed { index, label -> VaultItem(SecretRecord("totp-$index", "demo", "TOTP", 1, "2026-09-01T12:00:00Z"), SecretContent(label = label, secret = demoSeeds[index], url = "https://${label.lowercase()}.com")) }
        state.value = VaultUiState(email = "alex@studio.design", unlocked = true, demo = true, items = passwords + codes, lastSyncAt = System.currentTimeMillis(),
            devices = listOf(DeviceInfo("demo", "Pixel · this device", "Android", null, true), DeviceInfo("browser", "Chrome on MacBook", "Browser", null, false)))
    }
}
