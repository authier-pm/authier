package dev.authier.android

import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import java.util.UUID
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.time.Instant
import javax.crypto.SecretKey

/** Revalidate at selection time; never fill credentials from a deleted or changed snapshot. */
fun validateAutofillVault(current: VaultSnapshot, unlocked: VaultSnapshot) {
    require(current.email == unlocked.email && current.serverUrl == unlocked.serverUrl &&
        current.deviceId == unlocked.deviceId && current.encryptionSalt == unlocked.encryptionSalt &&
        current.authSecretEncrypted == unlocked.authSecretEncrypted) { "Your vault changed. Cancel and unlock again." }
}

fun validateAutofillSelection(current: VaultSnapshot, unlocked: VaultSnapshot, item: VaultItem) {
    validateAutofillVault(current, unlocked)
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

/** Persist before returning any generated value to Android. Existing passwords are never overwritten. */
fun createAutofillLogin(
    current: VaultSnapshot,
    unlocked: VaultSnapshot,
    content: SecretContent,
    key: SecretKey,
    destination: AutofillDestination,
): Pair<VaultSnapshot, VaultItem> {
    validateAutofillVault(current, unlocked)
    require(NativeAutofillTarget.packageFromAssociation(destination.packageName) == destination.packageName) { "Invalid Android app." }
    require(destination.webOrigin == null || httpsOrigin(destination.webOrigin) == destination.webOrigin) { "Invalid website." }
    require(content.label.isNotBlank() && content.password.isNotBlank()) { "Enter a name and password." }
    val associated = content.copy(url = destination.webOrigin, androidUri = destination.packageName.takeIf { destination.webOrigin == null })
    val encrypted = AuthierCrypto.encrypt(key, vaultJson.encodeToString(associated), current.encryptionSalt)
    val record = SecretRecord(UUID.randomUUID().toString(), encrypted, "LOGIN_CREDENTIALS", 1, Instant.now().toString())
    val write = PendingWrite(operation = "create", id = record.id, encrypted = encrypted, kind = record.kind)
    return current.copy(secrets = current.secrets + record, outbox = current.outbox + write) to VaultItem(record, associated, pending = true)
}
