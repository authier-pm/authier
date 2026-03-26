import { oc } from '@orpc/contract'
import type {
  InferContractRouterInputs,
  InferContractRouterOutputs
} from '@orpc/contract'
import {
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
  updateEncryptedSecretInputSchema,
  updateNewDevicePolicyInputSchema,
  updateRecoveryCooldownInputSchema,
  updateVaultLockTimeoutInputSchema,
  initiateMasterDeviceResetInputSchema,
  completeDeviceLoginInputSchema
} from './schemas'

export const vaultApiContract = {
  auth: {
    register: oc.input(registerInputSchema).output(authenticatedSessionSchema),
    requestDeviceChallenge: oc
      .input(requestDeviceChallengeInputSchema)
      .output(requestDeviceChallengeResultSchema),
    completeDeviceLogin: oc
      .input(completeDeviceLoginInputSchema)
      .output(authenticatedSessionSchema),
    initiateMasterDeviceReset: oc
      .input(initiateMasterDeviceResetInputSchema)
      .output(masterDeviceResetResultSchema),
    refresh: oc.input(refreshInputSchema).output(authenticatedSessionSchema),
    logout: oc.input(emptyInputSchema).output(okResultSchema)
  },
  session: {
    bootstrap: oc.input(emptyInputSchema).output(sessionBootstrapSchema)
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
    list: oc.input(emptyInputSchema).output(devicesListSchema),
    listPendingChallenges: oc
      .input(emptyInputSchema)
      .output(pendingChallengesListSchema),
    approveChallenge: oc.input(challengeActionInputSchema).output(okResultSchema),
    rejectChallenge: oc.input(challengeActionInputSchema).output(okResultSchema),
    rename: oc.input(renameDeviceInputSchema).output(currentDeviceSchema),
    logout: oc.input(deviceActionInputSchema).output(okResultSchema),
    remove: oc.input(deviceActionInputSchema).output(okResultSchema),
    setMaster: oc.input(setMasterDeviceInputSchema).output(okResultSchema)
  },
  security: {
    get: oc.input(emptyInputSchema).output(securityResponseSchema),
    updateNewDevicePolicy: oc
      .input(updateNewDevicePolicyInputSchema)
      .output(securityResponseSchema),
    updateRecoveryCooldown: oc
      .input(updateRecoveryCooldownInputSchema)
      .output(securityResponseSchema),
    updateVaultLockTimeout: oc
      .input(updateVaultLockTimeoutInputSchema)
      .output(securityResponseSchema)
  }
}

export type VaultApiInputs = InferContractRouterInputs<typeof vaultApiContract>
export type VaultApiOutputs = InferContractRouterOutputs<typeof vaultApiContract>
