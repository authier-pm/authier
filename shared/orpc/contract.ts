import { oc } from '@orpc/contract'
import { z } from 'zod'
import type {
  InferContractRouterInputs,
  InferContractRouterOutputs
} from '@orpc/contract'
import {
  createVaultSecretInputSchema,
  updateVaultSecretInputSchema,
  deleteVaultSecretInputSchema,
  mobileSecretRecordSchema,
  vaultSyncInputSchema,
  vaultSyncResultSchema,
  addNewDeviceInputSchema,
  authenticatedSessionSchema,
  currentDeviceSchema,
  challengeActionInputSchema,
  deleteEncryptedSecretInputSchema,
  deleteResultSchema,
  deviceActionInputSchema,
  devicesListSchema,
  emptyInputSchema,
  encryptedSecretPayloadSchema,
  encryptedSecretRecordSchema,
  markAsSyncedResultSchema,
  masterDeviceResetResultSchema,
  okResultSchema,
  pendingChallengesListSchema,
  refreshInputSchema,
  registerInputSchema,
  renameDeviceInputSchema,
  requestDeviceChallengeInputSchema,
  requestDeviceChallengeResultSchema,
  secretsListSchema,
  securityResponseSchema,
  setMasterDeviceInputSchema,
  sessionBootstrapSchema,
  syncSecretsSchema,
  tokenPairSchema,
  updateEncryptedSecretInputSchema,
  updateNewDevicePolicyInputSchema,
  updateRecoveryCooldownInputSchema,
  updateVaultLockTimeoutInputSchema,
  initiateMasterDeviceResetInputSchema,
  completeDeviceLoginInputSchema
} from './schemas'

const mobileProcedure = oc.errors({
  UNAUTHORIZED: { status: 401 },
  BAD_REQUEST: { status: 400 },
  NOT_FOUND: { status: 404 },
  CONFLICT: {
    status: 409,
    data: z.object({ currentVersion: z.number().int().positive() }).optional()
  },
  CURSOR_INVALID: { status: 400 }
})

export const vaultApiContract = {
  auth: {
    register: oc
      .route({
        method: 'POST',
        path: '/auth/register',
        operationId: 'authRegister',
        tags: ['auth']
      })
      .input(registerInputSchema)
      .output(authenticatedSessionSchema),
    requestDeviceChallenge: oc
      .route({
        method: 'POST',
        path: '/auth/requestDeviceChallenge',
        operationId: 'authRequestDeviceChallenge',
        tags: ['auth']
      })
      .input(requestDeviceChallengeInputSchema)
      .output(requestDeviceChallengeResultSchema),
    completeDeviceLogin: oc
      .route({
        method: 'POST',
        path: '/auth/completeDeviceLogin',
        operationId: 'authCompleteDeviceLogin',
        tags: ['auth']
      })
      .input(completeDeviceLoginInputSchema)
      .output(authenticatedSessionSchema),
    initiateMasterDeviceReset: oc
      .route({
        method: 'POST',
        path: '/auth/initiateMasterDeviceReset',
        operationId: 'authInitiateMasterDeviceReset',
        tags: ['auth']
      })
      .input(initiateMasterDeviceResetInputSchema)
      .output(masterDeviceResetResultSchema),
    refreshTokens: oc
      .route({
        method: 'POST',
        path: '/auth/refreshTokens',
        operationId: 'authRefreshTokens',
        tags: ['auth']
      })
      .input(refreshInputSchema)
      .output(tokenPairSchema),
    refresh: oc
      .route({
        method: 'POST',
        path: '/auth/refresh',
        operationId: 'authRefresh',
        tags: ['auth']
      })
      .input(refreshInputSchema)
      .output(authenticatedSessionSchema),
    logout: oc
      .route({
        method: 'POST',
        path: '/auth/logout',
        operationId: 'authLogout',
        tags: ['auth']
      })
      .input(emptyInputSchema)
      .output(okResultSchema)
  },
  session: {
    bootstrap: oc
      .route({
        method: 'POST',
        path: '/session/bootstrap',
        operationId: 'sessionBootstrap',
        tags: ['session']
      })
      .input(emptyInputSchema)
      .output(sessionBootstrapSchema),
    markAsSynced: oc
      .route({
        method: 'POST',
        path: '/session/markAsSynced',
        operationId: 'sessionMarkAsSynced',
        tags: ['session']
      })
      .input(emptyInputSchema)
      .output(markAsSyncedResultSchema),
    syncSecrets: oc
      .route({
        method: 'POST',
        path: '/session/syncSecrets',
        operationId: 'sessionSyncSecrets',
        tags: ['session']
      })
      .input(emptyInputSchema)
      .output(syncSecretsSchema)
  },
  mobile: {
    sync: mobileProcedure
      .route({
        method: 'POST',
        path: '/vault/sync',
        operationId: 'vaultSync',
        tags: ['vault']
      })
      .input(vaultSyncInputSchema)
      .output(vaultSyncResultSchema),
    create: mobileProcedure
      .route({
        method: 'POST',
        path: '/vault/create',
        operationId: 'vaultCreate',
        tags: ['vault']
      })
      .input(createVaultSecretInputSchema)
      .output(mobileSecretRecordSchema),
    update: mobileProcedure
      .route({
        method: 'POST',
        path: '/vault/update',
        operationId: 'vaultUpdate',
        tags: ['vault']
      })
      .input(updateVaultSecretInputSchema)
      .output(mobileSecretRecordSchema),
    delete: mobileProcedure
      .route({
        method: 'POST',
        path: '/vault/delete',
        operationId: 'vaultDelete',
        tags: ['vault']
      })
      .input(deleteVaultSecretInputSchema)
      .output(mobileSecretRecordSchema)
  },
  vault: {
    listSecrets: oc.input(emptyInputSchema).output(secretsListSchema),
    createSecret: oc
      .input(encryptedSecretPayloadSchema)
      .output(encryptedSecretRecordSchema),
    updateSecret: oc
      .input(updateEncryptedSecretInputSchema)
      .output(encryptedSecretRecordSchema),
    deleteSecret: oc
      .input(deleteEncryptedSecretInputSchema)
      .output(deleteResultSchema)
  },
  devices: {
    list: oc
      .route({
        method: 'POST',
        path: '/devices/list',
        operationId: 'devicesList',
        tags: ['devices']
      })
      .input(emptyInputSchema)
      .output(devicesListSchema),
    listPendingChallenges: oc
      .route({
        method: 'POST',
        path: '/devices/listPendingChallenges',
        operationId: 'devicesListPendingChallenges',
        tags: ['devices']
      })
      .input(emptyInputSchema)
      .output(pendingChallengesListSchema),
    approveChallenge: oc
      .route({
        method: 'POST',
        path: '/devices/approveChallenge',
        operationId: 'devicesApproveChallenge',
        tags: ['devices']
      })
      .input(challengeActionInputSchema)
      .output(okResultSchema),
    rejectChallenge: oc
      .route({
        method: 'POST',
        path: '/devices/rejectChallenge',
        operationId: 'devicesRejectChallenge',
        tags: ['devices']
      })
      .input(challengeActionInputSchema)
      .output(okResultSchema),
    rename: oc
      .route({
        method: 'POST',
        path: '/devices/rename',
        operationId: 'devicesRename',
        tags: ['devices']
      })
      .input(renameDeviceInputSchema)
      .output(currentDeviceSchema),
    logout: oc
      .route({
        method: 'POST',
        path: '/devices/logout',
        operationId: 'devicesLogout',
        tags: ['devices']
      })
      .input(deviceActionInputSchema)
      .output(okResultSchema),
    remove: oc
      .route({
        method: 'POST',
        path: '/devices/remove',
        operationId: 'devicesRemove',
        tags: ['devices']
      })
      .input(deviceActionInputSchema)
      .output(okResultSchema),
    setMaster: oc
      .route({
        method: 'POST',
        path: '/devices/setMaster',
        operationId: 'devicesSetMaster',
        tags: ['devices']
      })
      .input(setMasterDeviceInputSchema)
      .output(okResultSchema)
  },
  security: {
    get: oc
      .route({
        method: 'POST',
        path: '/security/get',
        operationId: 'securityGet',
        tags: ['security']
      })
      .input(emptyInputSchema)
      .output(securityResponseSchema),
    updateNewDevicePolicy: oc
      .route({
        method: 'POST',
        path: '/security/updateNewDevicePolicy',
        operationId: 'securityUpdateNewDevicePolicy',
        tags: ['security']
      })
      .input(updateNewDevicePolicyInputSchema)
      .output(securityResponseSchema),
    updateRecoveryCooldown: oc
      .route({
        method: 'POST',
        path: '/security/updateRecoveryCooldown',
        operationId: 'securityUpdateRecoveryCooldown',
        tags: ['security']
      })
      .input(updateRecoveryCooldownInputSchema)
      .output(securityResponseSchema),
    updateVaultLockTimeout: oc
      .route({
        method: 'POST',
        path: '/security/updateVaultLockTimeout',
        operationId: 'securityUpdateVaultLockTimeout',
        tags: ['security']
      })
      .input(updateVaultLockTimeoutInputSchema)
      .output(securityResponseSchema)
  }
}

export type VaultApiInputs = InferContractRouterInputs<typeof vaultApiContract>
export type VaultApiOutputs = InferContractRouterOutputs<
  typeof vaultApiContract
>
