package dev.authier.android

import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.annotation.RequiresApi
import androidx.compose.runtime.*
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.GetCredentialResponse
import androidx.credentials.PublicKeyCredential
import androidx.credentials.provider.BeginGetPublicKeyCredentialOption
import androidx.credentials.provider.PendingIntentHandler
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.coroutines.*
import javax.crypto.SecretKey

private data class TrustedPasskeyGet(val options: PasskeyGetOptions, val client: PasskeyClient)
private data class PendingPasskeyCreation(val saved: SavedPasskey, val response: String)

/** Launched only by our explicit PendingIntent, with the request populated by Android. */
@RequiresApi(34)
class PasskeyActivity : FragmentActivity() {
    private val store by lazy { VaultStore(this) }
    private val unlockStore by lazy { VaultUnlockStore(this) }
    private var snapshot: VaultSnapshot? = null
    private var key: SecretKey? = null
    private var verifiedUntil = 0L
    private var activeJob: Job? = null
    private var createOptions: PasskeyCreateOptions? = null
    private var createClient: PasskeyClient? = null
    private var getOptions = emptyList<TrustedPasskeyGet>()
    private var pendingCreation: PendingPasskeyCreation? = null
    private var choices = emptyList<SavedPasskey>()
    private var ui by mutableStateOf(PasskeyApprovalState(busy = true))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        setResult(RESULT_CANCELED)
        setContent {
            AuthierTheme { PasskeyApprovalScreen(ui, onPassword = { verify(password = it) }, onBiometric = { verify(biometric = true) },
                onCreate = ::create, onSelect = ::signIn, onCancel = ::finish) }
        }
        action {
            val unlocked = withContext(Dispatchers.IO) { store.read() }
            require(unlocked.authSecretEncrypted.isNotBlank() && intent.getStringExtra(ACCOUNT) == unlocked.deviceId + ":" + unlocked.encryptionSalt) {
                "Your account changed. Open Authier, sync, and retry from the website."
            }
            snapshot = unlocked
            val trust = PasskeyCallerTrust(this@PasskeyActivity)
            val creation = PendingIntentHandler.retrieveProviderCreateCredentialRequest(intent)
            if (creation != null) {
                val request = creation.callingRequest as? CreatePublicKeyCredentialRequest ?: error("Unsupported credential request.")
                val options = PasskeyWebAuthn.parseCreate(request.requestJson)
                val client = withContext(Dispatchers.IO) { trust.verify(creation.callingAppInfo, options.rp.id, request.clientDataHash) }
                createOptions = options
                createClient = client
                ui = ui.copy(creating = true, domain = options.rp.id, origin = client.origin, account = options.user.name,
                    requestingApp = creation.callingAppInfo.packageName)
            } else {
                val request = requireNotNull(PendingIntentHandler.retrieveBeginGetCredentialRequest(intent)) { "This passkey request is no longer available." }
                val caller = requireNotNull(request.callingAppInfo) { "Missing app identity." }
                val options = request.beginGetCredentialOptions.filterIsInstance<BeginGetPublicKeyCredentialOption>()
                require(options.size in 1..16) { "Unsupported passkey request." }
                getOptions = options.map { option ->
                    val parsed = PasskeyWebAuthn.parseGet(option.requestJson)
                    TrustedPasskeyGet(parsed, withContext(Dispatchers.IO) { trust.verify(caller, parsed.rpId, option.clientDataHash) })
                }
                ui = ui.copy(domain = getOptions.map { it.options.rpId }.distinct().joinToString(", "), origin = getOptions.first().client.origin,
                    requestingApp = caller.packageName)
                val rememberedKey = withContext(Dispatchers.IO) { unlockStore.restore(unlocked) }
                if (rememberedKey != null) acceptVerification(rememberedKey, rememberUnlock = false)
            }
            ui = ui.copy(ready = true, biometricEnabled = unlockStore.biometricEnabled(unlocked))
        }
        lifecycleScope.launch {
            delay(5 * 60_000)
            finish()
        }
        lifecycleScope.launch {
            while (true) {
                delay(1000)
                if (key != null && !verificationValid()) {
                    clearVerification()
                    ui = ui.copy(error = "Verification expired. Verify your identity again.")
                }
            }
        }
    }

    private fun verify(password: String? = null, biometric: Boolean = false) {
        if (!ui.ready || ui.busy) return
        action {
            val unlocked = requireNotNull(snapshot)
            validateAutofillVault(withContext(Dispatchers.IO) { store.read() }, unlocked)
            val verifiedKey = if (biometric) {
                val cipher = unlockStore.prepareBiometric(unlocked, enrolling = false)
                unlockStore.unlockBiometric(unlocked, BiometricUnlock.authenticate(this@PasskeyActivity, cipher, enrolling = false))
            } else withContext(Dispatchers.Default) { AuthierCrypto.deriveMasterKey(requireNotNull(password), unlocked.encryptionSalt) }
            acceptVerification(verifiedKey, rememberUnlock = true)
        }
    }

    private suspend fun acceptVerification(verifiedKey: SecretKey, rememberUnlock: Boolean) {
        val unlocked = requireNotNull(snapshot)
        val available = withContext(Dispatchers.Default) {
            AuthierCrypto.decrypt(verifiedKey, unlocked.authSecretEncrypted)
            readPasskeys(unlocked, verifiedKey)
        }
        validateAutofillVault(withContext(Dispatchers.IO) { store.read() }, unlocked)
        if (rememberUnlock) unlockStore.remember(unlocked, verifiedKey)
        else if (unlockStore.restore(unlocked) == null) return
        key = verifiedKey
        verifiedUntil = SystemClock.elapsedRealtime() + 60_000
        choices = available.filter { saved -> getOptions.any { it.options.matches(saved.passkey) } }
        ui = ui.copy(verified = true, accounts = choices.map { PasskeyAccount(it.record.id, it.passkey.userName, it.passkey.label, it.passkey.rpId, it.passkey.iconUrl) })
    }

    private fun verificationValid(): Boolean {
        val unlocked = snapshot ?: return false
        return key != null && SystemClock.elapsedRealtime() < verifiedUntil &&
            (unlocked.lockTimeoutSeconds == 0 || unlockStore.restore(unlocked) != null)
    }

    private fun create() {
        if (ui.busy || !verificationValid()) return
        action {
            val unlocked = requireNotNull(snapshot)
            val verifiedKey = requireNotNull(key)
            val options = requireNotNull(createOptions)
            val client = requireNotNull(createClient)
            if (pendingCreation == null) {
                pendingCreation = withContext(Dispatchers.IO) {
                    val current = store.read()
                    validateAutofillVault(current, unlocked)
                    PasskeyWebAuthn.requireNotExcluded(readPasskeys(current, verifiedKey).map { it.passkey }, options)
                    val (passkey, response) = PasskeyWebAuthn.create(options, client, userVerified = true)
                    val (next, saved) = queuePasskey(current, passkey, verifiedKey)
                    store.compareAndWrite(current, next)
                    PendingPasskeyCreation(saved, response)
                }
            }
            val created = requireNotNull(pendingCreation)
            withContext(Dispatchers.IO) { PasskeyPersistence(store).syncCreated(unlocked, created.saved.record.id) }
            require(verificationValid()) { "Verify your identity again before finishing registration." }
            withContext(Dispatchers.IO) {
                val current = store.read()
                validateAutofillVault(current, unlocked)
                require(current.secrets.any { it.id == created.saved.record.id && it.encrypted == created.saved.record.encrypted && it.deletedAt == null }) { "The passkey changed. Retry from the website." }
            }
            val result = Intent()
            PendingIntentHandler.setCreateCredentialResponse(result, CreatePublicKeyCredentialResponse(created.response))
            setResult(RESULT_OK, result)
            finish()
        }
    }

    private fun signIn(id: String) {
        if (ui.busy || !verificationValid()) return
        val selected = choices.singleOrNull { it.record.id == id } ?: return
        action {
            val unlocked = requireNotNull(snapshot)
            val request = getOptions.first { it.options.matches(selected.passkey) }
            val response = withContext(Dispatchers.Default) {
                PasskeyWebAuthn.assertion(selected.passkey, request.options, request.client, userVerified = true)
            }
            withContext(Dispatchers.IO) {
                val current = store.read()
                validateAutofillVault(current, unlocked)
                require(current.secrets.any { it == selected.record && it.deletedAt == null }) { "This passkey changed. Cancel and choose it again." }
            }
            require(verificationValid()) { "Verification expired. Try again." }
            val result = Intent()
            PendingIntentHandler.setGetCredentialResponse(result, GetCredentialResponse(PublicKeyCredential(response)))
            setResult(RESULT_OK, result)
            finish()
        }
    }

    private fun action(work: suspend () -> Unit) {
        activeJob = lifecycleScope.launch {
            ui = ui.copy(busy = true, error = null)
            // Android activity boundary: show recoverable network, verification, and protocol errors.
            try { work() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (failure: Exception) {
                ui = ui.copy(error = when (failure) {
                    is javax.crypto.AEADBadTagException -> "That master password could not unlock this vault."
                    is java.io.IOException -> "Connect to the internet and try again. New passkeys must sync before registration finishes."
                    else -> failure.message ?: "Unable to complete this passkey request."
                })
            } finally { ui = ui.copy(busy = false) }
        }
    }

    private fun clearVerification() {
        key = null
        verifiedUntil = 0
        choices = emptyList()
        ui = ui.copy(verified = false, accounts = emptyList())
    }

    override fun onStop() {
        activeJob?.cancel()
        clearVerification()
        pendingCreation = null
        if (!isFinishing) finish()
        super.onStop()
    }

    companion object { const val ACCOUNT = "dev.authier.android.passkey.ACCOUNT" }
}
