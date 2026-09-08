package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.Device
import dev.authier.android.generated.model.DevicesApproveChallengeRequest
import dev.authier.android.generated.model.DevicesList200Response
import dev.authier.android.generated.model.DevicesListPendingChallenges200Response
import dev.authier.android.generated.model.DevicesLogoutRequest
import dev.authier.android.generated.model.DevicesRenameRequest
import dev.authier.android.generated.model.DevicesSetMasterRequest
import dev.authier.android.generated.model.OkResult

interface DevicesApi {
    /**
     * POST devices/approveChallenge
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesApproveChallengeRequest
     * @return [OkResult]
     */
    @POST("devices/approveChallenge")
    suspend fun devicesApproveChallenge(@Body devicesApproveChallengeRequest: DevicesApproveChallengeRequest): OkResult

    /**
     * POST devices/list
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [DevicesList200Response]
     */
    @POST("devices/list")
    suspend fun devicesList(@Body body: kotlinx.serialization.json.JsonObject): DevicesList200Response

    /**
     * POST devices/listPendingChallenges
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [DevicesListPendingChallenges200Response]
     */
    @POST("devices/listPendingChallenges")
    suspend fun devicesListPendingChallenges(@Body body: kotlinx.serialization.json.JsonObject): DevicesListPendingChallenges200Response

    /**
     * POST devices/logout
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesLogoutRequest
     * @return [OkResult]
     */
    @POST("devices/logout")
    suspend fun devicesLogout(@Body devicesLogoutRequest: DevicesLogoutRequest): OkResult

    /**
     * POST devices/rejectChallenge
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesApproveChallengeRequest
     * @return [OkResult]
     */
    @POST("devices/rejectChallenge")
    suspend fun devicesRejectChallenge(@Body devicesApproveChallengeRequest: DevicesApproveChallengeRequest): OkResult

    /**
     * POST devices/remove
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesLogoutRequest
     * @return [OkResult]
     */
    @POST("devices/remove")
    suspend fun devicesRemove(@Body devicesLogoutRequest: DevicesLogoutRequest): OkResult

    /**
     * POST devices/rename
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesRenameRequest
     * @return [Device]
     */
    @POST("devices/rename")
    suspend fun devicesRename(@Body devicesRenameRequest: DevicesRenameRequest): Device

    /**
     * POST devices/setMaster
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param devicesSetMasterRequest
     * @return [OkResult]
     */
    @POST("devices/setMaster")
    suspend fun devicesSetMaster(@Body devicesSetMasterRequest: DevicesSetMasterRequest): OkResult

}
