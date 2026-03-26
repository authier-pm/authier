import { z } from 'zod'

export const emptyInputSchema = z.object({})

export const userNewDevicePolicySchema = z.enum([
  'ALLOW',
  'REQUIRE_ANY_DEVICE_APPROVAL',
  'REQUIRE_MASTER_DEVICE_APPROVAL'
])

export const encryptedSecretTypeSchema = z.enum([
  'TOTP',
  'LOGIN_CREDENTIALS'
])

export const deviceIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  platform: z.string().min(1)
})

export const addNewDeviceInputSchema = z.object({
  firebaseToken: z.string().nullable(),
  addDeviceSecret: z.string().min(1),
  addDeviceSecretEncrypted: z.string().min(1),
  encryptionSalt: z.string().min(1),
  devicePlatform: z.string().min(1)
})

export const registerInputSchema = z.object({
  userId: z.string().uuid(),
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  email: z.string().email(),
  input: addNewDeviceInputSchema
})

export const requestDeviceChallengeInputSchema = z.object({
  email: z.string().email(),
  deviceInput: deviceIdentitySchema
})

export const initiateMasterDeviceResetInputSchema =
  requestDeviceChallengeInputSchema.extend({
    decryptionChallengeId: z.number().int().positive()
  })

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1)
})

export const encryptedSecretPayloadSchema = z.object({
  kind: encryptedSecretTypeSchema,
  encrypted: z.string().min(1)
})

export const updateEncryptedSecretInputSchema = z.object({
  id: z.string().uuid(),
  patch: encryptedSecretPayloadSchema
})

export const deleteEncryptedSecretInputSchema = z.object({
  id: z.string().uuid()
})

export const renameDeviceInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1)
})

export const deviceActionInputSchema = z.object({
  id: z.string().min(1)
})

export const challengeActionInputSchema = z.object({
  id: z.number().int().positive()
})

export const setMasterDeviceInputSchema = z.object({
  newMasterDeviceId: z.string().min(1)
})

export const updateNewDevicePolicyInputSchema = z.object({
  newDevicePolicy: userNewDevicePolicySchema
})

export const updateRecoveryCooldownInputSchema = z.object({
  deviceRecoveryCooldownMinutes: z.number().int().nonnegative()
})

export const updateVaultLockTimeoutInputSchema = z.object({
  vaultLockTimeoutSeconds: z.number().int().nonnegative()
})

export const completeDeviceLoginInputSchema = z.object({
  challengeId: z.number().int().positive(),
  currentAddDeviceSecret: z.string().min(1),
  input: addNewDeviceInputSchema
})

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1)
})

export const encryptedSecretRecordSchema = z.object({
  id: z.string().uuid(),
  encrypted: z.string().min(1),
  kind: encryptedSecretTypeSchema,
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string().nullable()
})

export const currentDeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  platform: z.string().min(1),
  syncTOTP: z.boolean(),
  vaultLockTimeoutSeconds: z.number().int().nonnegative(),
  createdAt: z.string(),
  lastSyncAt: z.string().nullable(),
  logoutAt: z.string().nullable()
})

export const deviceListItemSchema = currentDeviceSchema.extend({
  firstIpAddress: z.string(),
  lastIpAddress: z.string(),
  lastGeoLocation: z.string()
})

export const pendingChallengeSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string(),
  deviceName: z.string().min(1),
  deviceId: z.string().min(1),
  ipAddress: z.string(),
  pushNotificationsSentCount: z.number().int().nonnegative(),
  pushNotificationsFailedCount: z.number().int().nonnegative(),
  masterDeviceResetRequestedAt: z.string().nullable(),
  masterDeviceResetProcessAt: z.string().nullable(),
  masterDeviceResetConfirmedAt: z.string().nullable(),
  masterDeviceResetRejectedAt: z.string().nullable()
})

export const securityStateSchema = z.object({
  newDevicePolicy: userNewDevicePolicySchema.nullable(),
  deviceRecoveryCooldownMinutes: z.number().int().nonnegative(),
  masterDeviceId: z.string().nullable(),
  vaultLockTimeoutSeconds: z.number().int().nonnegative()
})

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  masterDeviceId: z.string().nullable(),
  newDevicePolicy: userNewDevicePolicySchema.nullable(),
  deviceRecoveryCooldownMinutes: z.number().int().nonnegative()
})

export const sessionBootstrapSchema = z.object({
  user: sessionUserSchema,
  currentDevice: currentDeviceSchema,
  secrets: z.array(encryptedSecretRecordSchema),
  pendingChallenges: z.array(pendingChallengeSchema)
})

export const authenticatedSessionSchema = tokenPairSchema.extend({
  session: sessionBootstrapSchema
})

export const approvedChallengeSchema = z.object({
  status: z.literal('approved'),
  challengeId: z.number().int().positive(),
  userId: z.string().uuid(),
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  approvedAt: z.string(),
  addDeviceSecretEncrypted: z.string().min(1),
  encryptionSalt: z.string().min(1)
})

export const pendingChallengeResultSchema = z.object({
  status: z.literal('pending'),
  challengeId: z.number().int().positive(),
  pushNotificationsSentCount: z.number().int().nonnegative(),
  pushNotificationsFailedCount: z.number().int().nonnegative(),
  masterDeviceResetRequestedAt: z.string().nullable(),
  masterDeviceResetProcessAt: z.string().nullable(),
  masterDeviceResetConfirmedAt: z.string().nullable(),
  masterDeviceResetRejectedAt: z.string().nullable()
})

export const requestDeviceChallengeResultSchema = z.discriminatedUnion(
  'status',
  [approvedChallengeSchema, pendingChallengeResultSchema]
)

export const masterDeviceResetResultSchema = z.object({
  requestedAt: z.string(),
  processAt: z.string(),
  alreadyPending: z.boolean()
})

export const deleteResultSchema = z.object({
  id: z.string().uuid()
})

export const okResultSchema = z.object({
  ok: z.literal(true)
})

export const devicesListSchema = z.object({
  devices: z.array(deviceListItemSchema)
})

export const pendingChallengesListSchema = z.object({
  challenges: z.array(pendingChallengeSchema)
})

export const securityResponseSchema = z.object({
  security: securityStateSchema
})

export const secretsListSchema = z.object({
  secrets: z.array(encryptedSecretRecordSchema)
})
