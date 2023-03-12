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
  username: z.string(),
  password: z.string()
})

export const loginCredentialsFromContentScriptSchema =
  contentScriptContextSchema.extend({
    username: z.string(),
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
  autofill: z.boolean(),
  language: z.string(),
  syncTOTP: z.boolean(),
  theme: z.string().optional().nullable(),
  vaultLockTimeoutSeconds: z.number()
})

export const backgroundStateSerializableLockedSchema = z.object({
  email: z.string(),
  userId: z.string(),
  secrets: z.array(
    z.object({
      id: z.string(),
      encrypted: z.string(),
      kind: z.nativeEnum(EncryptedSecretType),
      lastUsedAt: z.string().nullable().optional(),
      createdAt: z.string(),
      deletedAt: z.string().nullable().optional(),
      updatedAt: z.string().nullable().optional()
    })
  ),
  encryptionSalt: z.string(),
  deviceName: z.string(),
  authSecretEncrypted: z.string(),
  authSecret: z.string(),
  lockTime: z.number(),
  autofill: z.boolean(),
  language: z.string(),
  theme: z.string(),
  syncTOTP: z.boolean(),
  masterEncryptionKey: z.string()
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
