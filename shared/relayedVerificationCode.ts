import { z } from 'zod'

/** Phones relay codes that remain usable for at most this long. */
export const RELAYED_CODE_LIFETIME_MS = 10 * 60 * 1000
export const MAX_ACTIVE_RELAYED_CODES = 20
/** Base64 envelope of the small JSON payload below; generous for long sender names. */
export const MAX_RELAYED_CODE_CIPHERTEXT_LENGTH = 2048

export const relayedCodeSchema = z.string().regex(/^[a-zA-Z0-9]{4,8}$/)
// Phone numbers, alphanumeric sender IDs or contact names, on a single line.
export const relayedCodeSenderSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[^\r\n]+$/)

/**
 * Plaintext of `RelayedVerificationCode.encrypted`. The phone encrypts it with
 * the vault key (shared/cryptoUtils.ts envelope), so the server never sees it.
 * android-app/.../SmsCodeRelay.kt writes the same JSON.
 */
export const relayedCodePayloadSchema = z.object({
  v: z.literal(1),
  code: relayedCodeSchema,
  sender: relayedCodeSenderSchema,
  receivedAt: z.number().int().positive()
})
export type RelayedCodePayload = z.infer<typeof relayedCodePayloadSchema>
