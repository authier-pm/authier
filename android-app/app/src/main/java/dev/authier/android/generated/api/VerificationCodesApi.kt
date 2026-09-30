package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.OkResult
import dev.authier.android.generated.model.RelayVerificationCodeInput
import dev.authier.android.generated.model.VerificationCodesRelay429Response

interface VerificationCodesApi {
    /**
     * POST verificationCodes/relay
     *
     *
     * Responses:
     *  - 200: OK
     *  - 429: 429
     *
     * @param relayVerificationCodeInput
     * @return [OkResult]
     */
    @POST("verificationCodes/relay")
    suspend fun verificationCodesRelay(@Body relayVerificationCodeInput: RelayVerificationCodeInput): OkResult

}
