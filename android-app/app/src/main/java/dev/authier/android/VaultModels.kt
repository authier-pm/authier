package dev.authier.android

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class SecretRecord(
    val id: String,
    val encrypted: String,
    val kind: String,
    val version: Int,
    val createdAt: String,
    val updatedAt: String? = null,
    val deletedAt: String? = null,
)

/** Only encrypted payloads enter the persisted outbox. Operation IDs survive retries. */
@Serializable
data class PendingWrite(
    val operationId: String = UUID.randomUUID().toString(),
    val operation: String,
    val id: String,
    val expectedVersion: Int? = null,
    val encrypted: String? = null,
    val kind: String? = null,
    val conflict: Boolean = false,
)

@Serializable
data class VaultSnapshot(
    val storageRevision: String = "",
    val email: String = "",
    val deviceId: String = UUID.randomUUID().toString(),
    val serverUrl: String = "https://api.authier.pm",
    val encryptionSalt: String = "",
    val authSecretEncrypted: String = "",
    val sealedTokens: String = "",
    val cursor: String? = null,
    val secrets: List<SecretRecord> = emptyList(),
    val outbox: List<PendingWrite> = emptyList(),
    val lockTimeoutSeconds: Int = 300,
    val lastSyncAt: Long? = null,
)

@Serializable
data class SessionTokens(val accessToken: String, val refreshToken: String)

/** This plaintext model exists in memory only, never in the snapshot or logs. */
@Serializable
data class SecretContent(
    val label: String = "",
    val url: String? = null,
    val username: String = "",
    val password: String = "",
    val secret: String = "",
    val digits: Int = 6,
    val period: Int = 30,
    val algorithm: String = "SHA1",
    val iconUrl: String? = null,
    val androidUri: String? = null,
    val iosUri: String? = null,
)

data class VaultItem(val record: SecretRecord, val content: SecretContent, val pending: Boolean = false, val conflict: Boolean = false)

/** Sync preserves every kind; native forms currently understand only these two payloads. */
fun isNativeEditableKind(kind: String): Boolean = kind == "LOGIN_CREDENTIALS" || kind == "TOTP"

fun isVisibleInNativeVault(record: SecretRecord): Boolean = record.deletedAt == null && isNativeEditableKind(record.kind)

fun requireNativeEditableKind(kind: String) {
    require(isNativeEditableKind(kind)) { "This item is preserved by vault sync. Manage passkeys in the Authier browser extension." }
}

data class DeviceInfo(val id: String, val name: String, val platform: String, val lastSyncAt: String?, val isCurrent: Boolean)
data class ApprovalInfo(val id: Int, val deviceName: String, val ipAddress: String, val createdAt: String)
data class SecurityInfo(val newDevicePolicy: String = "REQUIRE_ANY_DEVICE_APPROVAL", val recoveryMinutes: Int = 1440, val masterDeviceId: String? = null)

/** Apply a complete page and its cursor together. Pending local edits win until resolved. */
fun applySyncPage(snapshot: VaultSnapshot, changes: List<SecretRecord>, nextCursor: String): VaultSnapshot {
    val pendingIds = snapshot.outbox.map { it.id }.toSet()
    val merged = snapshot.secrets.associateBy { it.id }.toMutableMap()
    changes.forEach { incoming ->
        if (incoming.id !in pendingIds) {
            val existing = merged[incoming.id]
            if (existing == null || incoming.version >= existing.version) merged[incoming.id] = incoming
        }
    }
    return snapshot.copy(secrets = merged.values.toList(), cursor = nextCursor)
}
