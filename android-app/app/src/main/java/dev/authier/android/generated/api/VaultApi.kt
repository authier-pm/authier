package dev.authier.android.generated.api

import dev.authier.android.generated.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Response
import okhttp3.RequestBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

import dev.authier.android.generated.model.CreateVaultSecretInput
import dev.authier.android.generated.model.DeleteVaultSecretInput
import dev.authier.android.generated.model.SyncSecretRecord
import dev.authier.android.generated.model.UpdateVaultSecretInput
import dev.authier.android.generated.model.VaultSync400Response
import dev.authier.android.generated.model.VaultSync401Response
import dev.authier.android.generated.model.VaultSync404Response
import dev.authier.android.generated.model.VaultSync409Response
import dev.authier.android.generated.model.VaultSyncInput
import dev.authier.android.generated.model.VaultSyncResult

interface VaultApi {
    /**
     * POST vault/create
     *
     *
     * Responses:
     *  - 200: OK
     *  - 400: 400
     *  - 401: 401
     *  - 404: 404
     *  - 409: 409
     *
     * @param createVaultSecretInput
     * @return [SyncSecretRecord]
     */
    @POST("vault/create")
    suspend fun vaultCreate(@Body createVaultSecretInput: CreateVaultSecretInput): SyncSecretRecord

    /**
     * POST vault/delete
     *
     *
     * Responses:
     *  - 200: OK
     *  - 400: 400
     *  - 401: 401
     *  - 404: 404
     *  - 409: 409
     *
     * @param deleteVaultSecretInput
     * @return [SyncSecretRecord]
     */
    @POST("vault/delete")
    suspend fun vaultDelete(@Body deleteVaultSecretInput: DeleteVaultSecretInput): SyncSecretRecord

    /**
     * POST vault/sync
     *
     *
     * Responses:
     *  - 200: OK
     *  - 400: 400
     *  - 401: 401
     *  - 404: 404
     *  - 409: 409
     *
     * @param vaultSyncInput
     * @return [VaultSyncResult]
     */
    @POST("vault/sync")
    suspend fun vaultSync(@Body vaultSyncInput: VaultSyncInput): VaultSyncResult

    /**
     * POST vault/update
     *
     *
     * Responses:
     *  - 200: OK
     *  - 400: 400
     *  - 401: 401
     *  - 404: 404
     *  - 409: 409
     *
     * @param updateVaultSecretInput
     * @return [SyncSecretRecord]
     */
    @POST("vault/update")
    suspend fun vaultUpdate(@Body updateVaultSecretInput: UpdateVaultSecretInput): SyncSecretRecord

}
