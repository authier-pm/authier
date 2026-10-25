package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.time.Instant
import java.util.UUID
import javax.crypto.SecretKey

data class SavedPasskey(val record: SecretRecord, val passkey: PasskeyData)

fun decodePasskey(plaintext: String): PasskeyData = vaultJson.decodeFromString<PasskeyData>(plaintext).validated()

fun readPasskeys(snapshot: VaultSnapshot, key: SecretKey): List<SavedPasskey> = snapshot.secrets
    .filter { it.kind == "PASSKEY" && it.deletedAt == null }
    .mapNotNull { record ->
        // An incompatible future credential must not hide the rest of the vault.
        runCatching { SavedPasskey(record, decodePasskey(AuthierCrypto.decrypt(key, record.encrypted))) }.getOrNull()
    }

fun decodeVaultItem(record: SecretRecord, plaintext: String, pending: PendingWrite?): VaultItem {
    val content = if (record.kind == "PASSKEY") decodePasskey(plaintext).content() else SecretContentDecoder.decode(plaintext, record.kind)
    return VaultItem(record, content, pending != null, pending?.conflict == true)
}

/** Only the label is editable. Patch the original payload so keys and unknown fields survive. */
fun renamePasskey(snapshot: VaultSnapshot, id: String, label: String, key: SecretKey): VaultSnapshot {
    require(label.isNotBlank()) { "Give this passkey a name." }
    require(snapshot.outbox.none { it.id == id }) { "Sync or resolve this passkey's pending change first." }
    val record = requireNotNull(snapshot.secrets.find { it.id == id && it.kind == "PASSKEY" && it.deletedAt == null })
    val plaintext = AuthierCrypto.decrypt(key, record.encrypted)
    decodePasskey(plaintext)
    val patched = JsonObject((vaultJson.parseToJsonElement(plaintext) as JsonObject) + ("label" to JsonPrimitive(label.trim())))
    val encrypted = AuthierCrypto.encrypt(key, patched.toString(), snapshot.encryptionSalt)
    val next = record.copy(encrypted = encrypted, updatedAt = Instant.now().toString())
    return snapshot.copy(secrets = snapshot.secrets.map { if (it.id == id) next else it },
        outbox = snapshot.outbox + PendingWrite(operation = "update", id = id, expectedVersion = record.version, encrypted = encrypted, kind = "PASSKEY"))
}

fun queuePasskey(snapshot: VaultSnapshot, passkey: PasskeyData, key: SecretKey): Pair<VaultSnapshot, SavedPasskey> {
    passkey.validated()
    val encrypted = AuthierCrypto.encrypt(key, vaultJson.encodeToString(passkey), snapshot.encryptionSalt)
    val record = SecretRecord(UUID.randomUUID().toString(), encrypted, "PASSKEY", 1, passkey.createdAt)
    val write = PendingWrite(operation = "create", id = record.id, encrypted = encrypted, kind = "PASSKEY")
    return snapshot.copy(secrets = snapshot.secrets + record, outbox = snapshot.outbox + write) to SavedPasskey(record, passkey)
}

/** Complete registration only after backend persistence; retry the same durable operation ID. */
class PasskeyPersistence(private val store: VaultStore) {
    suspend fun syncCreated(unlocked: VaultSnapshot, id: String) {
        val current = store.read()
        validateAutofillVault(current, unlocked)
        val operation = current.outbox.singleOrNull { it.id == id } ?: return
        require(operation.operation == "create" && operation.kind == "PASSKEY" && !operation.conflict)
        val tokens = requireNotNull(store.openTokens(current.sealedTokens)) { "Open Authier and reconnect your account before creating a passkey." }
        val api = ApiFacade(current.serverUrl, currentDeviceId = current.deviceId).apply { accessToken = tokens.accessToken }
        val saved = try { api.write(operation) } catch (error: ApiFailure) {
            if (error.status != 401) throw error
            val refreshed = api.refresh(tokens.refreshToken)
            val sealed = store.sealTokens(refreshed)
            store.update { latest -> validateAutofillVault(latest, unlocked); latest.copy(sealedTokens = sealed) }
            api.accessToken = refreshed.accessToken
            api.write(operation)
        } finally { api.accessToken = null }
        store.update { latest ->
            validateAutofillVault(latest, unlocked)
            require(latest.outbox.any { it.operationId == operation.operationId }) { "The passkey changed. Retry from the website." }
            latest.copy(secrets = latest.secrets.filter { it.id != saved.id } + saved,
                outbox = latest.outbox.filter { it.operationId != operation.operationId })
        }
    }
}
