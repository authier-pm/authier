package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.time.Instant
import javax.crypto.SecretKey

/** Revalidate at selection time; never fill credentials from a deleted or changed snapshot. */
fun validateAutofillSelection(current: VaultSnapshot, unlocked: VaultSnapshot, item: VaultItem) {
    require(current.email == unlocked.email && current.serverUrl == unlocked.serverUrl &&
        current.deviceId == unlocked.deviceId && current.encryptionSalt == unlocked.encryptionSalt &&
        current.authSecretEncrypted == unlocked.authSecretEncrypted) { "Your vault changed. Cancel and unlock again." }
    require(item.record.kind == "LOGIN_CREDENTIALS" && item.record.deletedAt == null &&
        current.secrets.any { it == item.record }) { "This login changed. Cancel and choose it again." }
}

/** Patch the original JSON to preserve imported fields this client doesn't understand. */
fun associateAutofillLogin(
    current: VaultSnapshot,
    unlocked: VaultSnapshot,
    item: VaultItem,
    key: SecretKey,
    requestedPackage: String,
): VaultSnapshot {
    require(NativeAutofillTarget.packageFromAssociation(requestedPackage) == requestedPackage) { "Invalid Android app." }
    validateAutofillSelection(current, unlocked, item)
    require(current.outbox.none { it.id == item.record.id }) { "Open Authier and sync or resolve this login's pending change before linking it." }
    val original = vaultJson.parseToJsonElement(AuthierCrypto.decrypt(key, item.record.encrypted)) as JsonObject
    val patched = JsonObject(original + ("androidUri" to JsonPrimitive(requestedPackage)))
    val encrypted = AuthierCrypto.encrypt(key, patched.toString(), current.encryptionSalt)
    val record = item.record.copy(encrypted = encrypted, updatedAt = Instant.now().toString())
    val write = PendingWrite(operation = "update", id = record.id, expectedVersion = record.version,
        encrypted = encrypted, kind = record.kind)
    return current.copy(secrets = current.secrets.map { if (it.id == record.id) record else it }, outbox = current.outbox + write)
}
