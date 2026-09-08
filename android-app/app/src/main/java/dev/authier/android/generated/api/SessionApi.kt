package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.Session
import dev.authier.android.generated.model.SessionMarkAsSynced200Response
import dev.authier.android.generated.model.SessionSyncSecrets200Response

interface SessionApi {
    /**
     * POST session/bootstrap
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [Session]
     */
    @POST("session/bootstrap")
    suspend fun sessionBootstrap(@Body body: kotlinx.serialization.json.JsonObject): Session

    /**
     * POST session/markAsSynced
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [SessionMarkAsSynced200Response]
     */
    @POST("session/markAsSynced")
    suspend fun sessionMarkAsSynced(@Body body: kotlinx.serialization.json.JsonObject): SessionMarkAsSynced200Response

    /**
     * POST session/syncSecrets
     *
     *
     * Responses:
     *  - 200: OK
     *
     * @param body
     * @return [SessionSyncSecrets200Response]
     */
    @POST("session/syncSecrets")
    suspend fun sessionSyncSecrets(@Body body: kotlinx.serialization.json.JsonObject): SessionSyncSecrets200Response

}
