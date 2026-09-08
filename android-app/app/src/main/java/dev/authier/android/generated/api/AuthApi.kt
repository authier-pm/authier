package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.AuthInitiateMasterDeviceReset200Response
import dev.authier.android.generated.model.AuthInitiateMasterDeviceResetRequest
import dev.authier.android.generated.model.AuthenticatedSession
import dev.authier.android.generated.model.CompleteDeviceLoginInput
import dev.authier.android.generated.model.DeviceChallenge
import dev.authier.android.generated.model.OkResult
import dev.authier.android.generated.model.RefreshInput
import dev.authier.android.generated.model.RegisterInput
import dev.authier.android.generated.model.RequestDeviceChallengeInput
import dev.authier.android.generated.model.TokenPair

interface AuthApi {
    /**
     * POST auth/completeDeviceLogin
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param completeDeviceLoginInput
     * @return [AuthenticatedSession]
     */
    @POST("auth/completeDeviceLogin")
    suspend fun authCompleteDeviceLogin(@Body completeDeviceLoginInput: CompleteDeviceLoginInput): AuthenticatedSession

    /**
     * POST auth/initiateMasterDeviceReset
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param authInitiateMasterDeviceResetRequest
     * @return [AuthInitiateMasterDeviceReset200Response]
     */
    @POST("auth/initiateMasterDeviceReset")
    suspend fun authInitiateMasterDeviceReset(@Body authInitiateMasterDeviceResetRequest: AuthInitiateMasterDeviceResetRequest): AuthInitiateMasterDeviceReset200Response

    /**
     * POST auth/logout
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [OkResult]
     */
    @POST("auth/logout")
    suspend fun authLogout(@Body body: kotlinx.serialization.json.JsonObject): OkResult

    /**
     * POST auth/refresh
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param refreshInput
     * @return [AuthenticatedSession]
     */
    @POST("auth/refresh")
    suspend fun authRefresh(@Body refreshInput: RefreshInput): AuthenticatedSession

    /**
     * POST auth/refreshTokens
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param refreshInput
     * @return [TokenPair]
     */
    @POST("auth/refreshTokens")
    suspend fun authRefreshTokens(@Body refreshInput: RefreshInput): TokenPair

    /**
     * POST auth/register
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param registerInput
     * @return [AuthenticatedSession]
     */
    @POST("auth/register")
    suspend fun authRegister(@Body registerInput: RegisterInput): AuthenticatedSession

    /**
     * POST auth/requestDeviceChallenge
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param requestDeviceChallengeInput
     * @return [DeviceChallenge]
     */
    @POST("auth/requestDeviceChallenge")
    suspend fun authRequestDeviceChallenge(@Body requestDeviceChallengeInput: RequestDeviceChallengeInput): DeviceChallenge

}
