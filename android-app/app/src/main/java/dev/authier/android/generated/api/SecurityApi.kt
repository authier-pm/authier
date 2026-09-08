package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.SecurityResponse
import dev.authier.android.generated.model.SecurityUpdateNewDevicePolicyRequest
import dev.authier.android.generated.model.SecurityUpdateRecoveryCooldownRequest
import dev.authier.android.generated.model.SecurityUpdateVaultLockTimeoutRequest

interface SecurityApi {
    /**
     * POST security/get
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [SecurityResponse]
     */
    @POST("security/get")
    suspend fun securityGet(@Body body: kotlinx.serialization.json.JsonObject): SecurityResponse

    /**
     * POST security/updateNewDevicePolicy
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param securityUpdateNewDevicePolicyRequest
     * @return [SecurityResponse]
     */
    @POST("security/updateNewDevicePolicy")
    suspend fun securityUpdateNewDevicePolicy(@Body securityUpdateNewDevicePolicyRequest: SecurityUpdateNewDevicePolicyRequest): SecurityResponse

    /**
     * POST security/updateRecoveryCooldown
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param securityUpdateRecoveryCooldownRequest
     * @return [SecurityResponse]
     */
    @POST("security/updateRecoveryCooldown")
    suspend fun securityUpdateRecoveryCooldown(@Body securityUpdateRecoveryCooldownRequest: SecurityUpdateRecoveryCooldownRequest): SecurityResponse

    /**
     * POST security/updateVaultLockTimeout
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param securityUpdateVaultLockTimeoutRequest
     * @return [SecurityResponse]
     */
    @POST("security/updateVaultLockTimeout")
    suspend fun securityUpdateVaultLockTimeout(@Body securityUpdateVaultLockTimeoutRequest: SecurityUpdateVaultLockTimeoutRequest): SecurityResponse

}
