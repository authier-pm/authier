package dev.authier.android

import dev.authier.android.generated.api.AuthApi
import dev.authier.android.generated.api.DevicesApi
import dev.authier.android.generated.api.SecurityApi
import dev.authier.android.generated.api.SessionApi
import dev.authier.android.generated.api.VaultApi as GeneratedVaultApi
import dev.authier.android.generated.model.AddNewDeviceInput
import dev.authier.android.generated.model.AuthenticatedSession
import dev.authier.android.generated.model.CompleteDeviceLoginInput
import dev.authier.android.generated.model.CreateVaultSecretInput
import dev.authier.android.generated.model.DeleteVaultSecretInput
import dev.authier.android.generated.model.DeviceChallenge
import dev.authier.android.generated.model.DeviceIdentity
import dev.authier.android.generated.model.DevicesApproveChallengeRequest
import dev.authier.android.generated.model.DevicesLogoutRequest
import dev.authier.android.generated.model.PendingDeviceApproval
import dev.authier.android.generated.model.RefreshInput
import dev.authier.android.generated.model.RegisterInput
import dev.authier.android.generated.model.RequestDeviceChallengeInput
import dev.authier.android.generated.model.SecretRecord as ApiSecret
import dev.authier.android.generated.model.SecurityState
import dev.authier.android.generated.model.SecurityUpdateNewDevicePolicyRequest
import dev.authier.android.generated.model.SecurityUpdateVaultLockTimeoutRequest
import dev.authier.android.generated.model.Session
import dev.authier.android.generated.model.SyncSecretRecord
import dev.authier.android.generated.model.UpdateVaultSecretInput
import dev.authier.android.generated.model.VaultSyncInput
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/** The application sees domain records; HTTP paths and wire models are generated. */
class ApiFacade(serverUrl: String, private var currentDeviceId: String? = null) : VaultApi {
    @Volatile override var accessToken: String? = null
    // Optional absent fields must be omitted; the server distinguishes omitted
    // cursor from explicit null. Required nullable fields still encode as null.
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = false }
    private val emptyInput = JsonObject(emptyMap())
    private val origin = serverUrl.trimEnd('/').toHttpUrl().also {
        require(it.isHttps || BuildConfig.DEBUG) { "The API must use HTTPS" }
        require(it.username.isEmpty() && it.password.isEmpty() && it.query == null && it.fragment == null) {
            "Use an API server URL without credentials, query, or fragment"
        }
    }
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
            accessToken?.let { request.header("Authorization", "Bearer $it") }
            chain.proceed(request.build())
        }.build()
    private val retrofit = Retrofit.Builder()
        .baseUrl(origin.toString().trimEnd('/') + "/api/v1/")
        .client(http)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
    private val auth = retrofit.create(AuthApi::class.java)
    private val session = retrofit.create(SessionApi::class.java)
    private val vault = retrofit.create(GeneratedVaultApi::class.java)
    private val device = retrofit.create(DevicesApi::class.java)
    private val settings = retrofit.create(SecurityApi::class.java)

    override suspend fun register(email: String, userId: String, deviceId: String, deviceName: String, secret: DeviceSecretInput) = request {
        auth.authRegister(RegisterInput(userId, deviceId, deviceName, email, secret.toApi())).toDomain()
    }

    override suspend fun challenge(email: String, deviceId: String, deviceName: String) = request {
        when (val result = auth.authRequestDeviceChallenge(RequestDeviceChallengeInput(email, DeviceIdentity(deviceId, deviceName, "android")))) {
            is DeviceChallenge.ApprovedWrapper -> LoginChallenge(
                "approved", result.value.challengeId, result.value.encryptionSalt, result.value.addDeviceSecretEncrypted
            )
            is DeviceChallenge.PendingWrapper -> LoginChallenge("pending", result.value.challengeId)
        }
    }

    override suspend fun completeLogin(challengeId: Int, currentAddDeviceSecret: String, secret: DeviceSecretInput) = request {
        auth.authCompleteDeviceLogin(CompleteDeviceLoginInput(challengeId, currentAddDeviceSecret, secret.toApi())).toDomain()
    }

    override suspend fun refresh(refreshToken: String) = request {
        val tokens = auth.authRefreshTokens(RefreshInput(refreshToken))
        SessionTokens(tokens.accessToken, tokens.refreshToken)
    }

    override suspend fun logout() { request { auth.authLogout(emptyInput) } }
    override suspend fun bootstrap() = request { session.sessionBootstrap(emptyInput).toDomain() }
    override suspend fun sync(cursor: String?) = request {
        val page = vault.vaultSync(VaultSyncInput(cursor, 200))
        SyncPage(page.changes.map { it.secret.toDomain() }, page.nextCursor, page.hasMore)
    }

    override suspend fun write(operation: PendingWrite): SecretRecord = request {
        val response = when (operation.operation) {
            "create" -> vault.vaultCreate(CreateVaultSecretInput(
                CreateVaultSecretInput.Kind.valueOf(requireNotNull(operation.kind)),
                requireNotNull(operation.encrypted), operation.operationId, operation.id
            ))
            "update" -> vault.vaultUpdate(UpdateVaultSecretInput(
                UpdateVaultSecretInput.Kind.valueOf(requireNotNull(operation.kind)),
                requireNotNull(operation.encrypted), operation.operationId, operation.id,
                requireNotNull(operation.expectedVersion)
            ))
            "delete" -> vault.vaultDelete(DeleteVaultSecretInput(
                operation.operationId, operation.id, requireNotNull(operation.expectedVersion)
            ))
            else -> error("Unknown queued vault operation")
        }
        response.toDomain()
    }

    override suspend fun devices() = request {
        device.devicesList(emptyInput).devices.map {
            DeviceInfo(it.id, it.name, it.platform, it.lastSyncAt, it.id == currentDeviceId)
        }
    }
    override suspend fun approvals() = request {
        device.devicesListPendingChallenges(emptyInput).challenges.map { it.toDomain() }
    }
    override suspend fun approve(id: Int) { request { device.devicesApproveChallenge(DevicesApproveChallengeRequest(id)) } }
    override suspend fun reject(id: Int) { request { device.devicesRejectChallenge(DevicesApproveChallengeRequest(id)) } }
    override suspend fun removeDevice(id: String) { request { device.devicesRemove(DevicesLogoutRequest(id)) } }
    override suspend fun security() = request { settings.securityGet(emptyInput).security.toDomain() }
    override suspend fun updatePolicy(policy: String) = request {
        settings.securityUpdateNewDevicePolicy(SecurityUpdateNewDevicePolicyRequest(
            SecurityUpdateNewDevicePolicyRequest.NewDevicePolicy.valueOf(policy)
        )).security.toDomain()
    }
    override suspend fun updateLockTimeout(seconds: Int) {
        request { settings.securityUpdateVaultLockTimeout(SecurityUpdateVaultLockTimeoutRequest(seconds)) }
    }

    private fun DeviceSecretInput.toApi() = AddNewDeviceInput(null, addDeviceSecret, addDeviceSecretEncrypted, encryptionSalt, "android")
    private fun AuthenticatedSession.toDomain() = AuthSession(SessionTokens(accessToken, refreshToken), session.toDomain())
    private fun Session.toDomain(): BootstrapInfo {
        currentDeviceId = currentDevice.id
        return BootstrapInfo(user.email.orEmpty(), secrets.map { it.toDomain() }, currentDevice.vaultLockTimeoutSeconds, pendingChallenges.map { it.toDomain() })
    }
    private fun ApiSecret.toDomain() = SecretRecord(id, encrypted, kind.value, version, createdAt, updatedAt)
    private fun SyncSecretRecord.toDomain() = SecretRecord(id, encrypted, kind.value, version, createdAt, updatedAt, deletedAt)
    private fun PendingDeviceApproval.toDomain() = ApprovalInfo(id, deviceName, ipAddress, createdAt)
    private fun SecurityState.toDomain() = SecurityInfo(newDevicePolicy?.value ?: "ALLOW", deviceRecoveryCooldownMinutes, masterDeviceId)

    private suspend fun <T> request(block: suspend () -> T): T {
        try {
            return block()
        } catch (error: HttpException) {
            val response = error.response()
            val raw = response?.raw()
            val source = response?.errorBody()?.source()
            // Bound diagnostic memory even if a proxy returns a huge HTML error page.
            val truncated = source?.request(65_537) == true
            val body = source?.readUtf8(minOf(source.buffer.size, 65_536))
            response?.errorBody()?.close()
            val parsed = parseError(body)
            val details = ApiErrorDetails(error.code(), raw?.request?.method.orEmpty(),
                raw?.request?.url?.newBuilder()?.query(null)?.fragment(null)?.build()?.toString().orEmpty(),
                body.orEmpty() + if (truncated) "\n[Response truncated after 64 KiB]" else "",
                response?.headers()?.get("cf-ray") ?: response?.headers()?.get("x-request-id"))
            throw ApiFailure(error.code(), (parsed?.get("message") as? JsonPrimitive)?.contentOrNull ?: "API request failed (${error.code()})",
                (parsed?.get("code") as? JsonPrimitive)?.contentOrNull, error, details)
        }
    }

    private fun parseError(body: String?): JsonObject? {
        if (body == null) return null
        return try { json.parseToJsonElement(body) as? JsonObject } catch (_: SerializationException) { null }
    }
}
