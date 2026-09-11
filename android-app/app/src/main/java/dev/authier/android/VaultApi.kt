package dev.authier.android

/** Transport boundary; ApiFacade implements this with the generated OpenAPI client. */
interface VaultApi {
    var accessToken: String?
    suspend fun register(email: String, userId: String, deviceId: String, deviceName: String, secret: DeviceSecretInput): AuthSession
    suspend fun challenge(email: String, deviceId: String, deviceName: String): LoginChallenge
    suspend fun completeLogin(challengeId: Int, currentAddDeviceSecret: String, secret: DeviceSecretInput): AuthSession
    suspend fun refresh(refreshToken: String): SessionTokens
    suspend fun logout()
    suspend fun bootstrap(): BootstrapInfo
    suspend fun sync(cursor: String?): SyncPage
    suspend fun write(operation: PendingWrite): SecretRecord
    suspend fun devices(): List<DeviceInfo>
    suspend fun approvals(): List<ApprovalInfo>
    suspend fun approve(id: Int)
    suspend fun reject(id: Int)
    suspend fun removeDevice(id: String)
    suspend fun setMasterDevice(id: String)
    suspend fun security(): SecurityInfo
    suspend fun updatePolicy(policy: String): SecurityInfo
    suspend fun updateLockTimeout(seconds: Int)
}

data class DeviceSecretInput(val addDeviceSecret: String, val addDeviceSecretEncrypted: String, val encryptionSalt: String)
data class AuthSession(val tokens: SessionTokens, val bootstrap: BootstrapInfo)
data class BootstrapInfo(val email: String, val secrets: List<SecretRecord>, val lockTimeoutSeconds: Int, val approvals: List<ApprovalInfo>)
data class LoginChallenge(val status: String, val challengeId: Int, val encryptionSalt: String? = null, val addDeviceSecretEncrypted: String? = null)
data class SyncPage(val changes: List<SecretRecord>, val nextCursor: String, val hasMore: Boolean)

class ApiFailure(val status: Int, message: String, val code: String? = null, cause: Throwable? = null, val details: ApiErrorDetails? = null) : Exception(message, cause)

/** Only failed response diagnostics, kept in memory; never request bodies or authorization headers. */
data class ApiErrorDetails(
    val status: Int,
    val method: String,
    val url: String,
    val responseBody: String,
    val requestId: String? = null,
)
