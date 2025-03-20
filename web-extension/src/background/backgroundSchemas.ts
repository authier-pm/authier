import {
  EncryptedSecretType,
  WebInputType
} from '@shared/generated/graphqlBaseTypes'
import { z } from 'zod'

export const capturedInputSchema = z.object({
  cssSelector: z.string().min(1),
  domOrdinal: z.number(),
  type: z.union([
    z.literal('input'),
    z.literal('submit'),
    z.literal('keydown')
  ]),
  kind: z.nativeEnum(WebInputType),
  inputted: z.string().optional()
})

export const contentScriptContextSchema = z.object({
  capturedInputEvents: z.array(capturedInputSchema),
  openInVault: z.boolean()
})

export const loginCredentialSchema = z.object({
  username: z.string().nullable(),
  password: z.string()
})

export const loginCredentialsFromContentScriptSchema =
  contentScriptContextSchema.extend({
    username: z.string().nullable(),
    password: z.string()
  })

export const encryptedDataSchema = loginCredentialSchema.extend({
  iconUrl: z.string().nullable(),
  url: z.string(),
  label: z.string()
})

export const capturedEventsPayloadSchema = z.object({
  url: z.string(),
  inputEvents: z.array(capturedInputSchema)
})

export const webInputElementSchema = z.object({
  domOrdinal: z.number(),
  domPath: z.string(),
  kind: z.nativeEnum(WebInputType),
  url: z.string()
})

export const settingsSchema = z.object({
  autofillCredentialsEnabled: z.boolean(),
  autofillTOTPEnabled: z.boolean(),
  uiLanguage: z.string(),
  syncTOTP: z.boolean(),
  vaultLockTimeoutSeconds: z.number(),
  notificationOnVaultUnlock: z.boolean(),
  notificationOnWrongPasswordAttempts: z.number()
})

export const backgroundStateSerializableLockedSchema = z.object({
  email: z.string(),
  userId: z.string(),
  secrets: z.array(
    z.object({
      id: z.string(),
      encrypted: z.string(),
      kind: z.nativeEnum(EncryptedSecretType),
      createdAt: z.string(),
      deletedAt: z.string().nullable().optional(),
      updatedAt: z.string().nullable().optional()
    })
  ),
  encryptionSalt: z.string(),
  deviceName: z.string(),
  authSecretEncrypted: z.string(),
  authSecret: z.string(),
  vaultLockTimeoutSeconds: z.number().nullable(),
  autofillCredentialsEnabled: z.boolean().nullable(),
  autofillTOTPEnabled: z.boolean().nullable(),
  uiLanguage: z.string().nullable(),
  syncTOTP: z.boolean().nullable(),
  theme: z.string(),
  masterEncryptionKey: z.string(),
  notificationOnVaultUnlock: z.boolean(),
  notificationOnWrongPasswordAttempts: z.number()
})

export const payloadSchema = z.union([
  capturedEventsPayloadSchema,
  webInputElementSchema,
  settingsSchema,
  backgroundStateSerializableLockedSchema,
  loginCredentialsFromContentScriptSchema,
  encryptedDataSchema,
  loginCredentialSchema,
  contentScriptContextSchema
])
