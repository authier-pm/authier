import { z } from 'zod'

// Budget the escaped HTML inside the model's JSON message, not tokens or JS
// characters. Leave ample room for instructions, the schema and the response.
export const MAX_PASSWORD_FORM_HTML_BYTES = 16_000
export const passwordFormHtmlByteLength = (html: string) =>
  new TextEncoder().encode(JSON.stringify(html)).byteLength

export const passwordFormKindSchema = z.enum([
  'LOGIN',
  'SIGNUP',
  'CHANGE_PASSWORD',
  'UNKNOWN'
])

export const normalizePasswordFormUrl = (value: string) => {
  const url = new URL(value)
  url.search = ''
  url.hash = ''
  url.username = ''
  url.password = ''
  return url.href
}

export const passwordFormSnapshotSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine((value) => /^https?:/.test(value))
    .transform(normalizePasswordFormUrl),
  language: z.string().max(35),
  html: z
    .string()
    .min(1)
    .max(MAX_PASSWORD_FORM_HTML_BYTES)
    .refine(
      (html) =>
        passwordFormHtmlByteLength(html) <= MAX_PASSWORD_FORM_HTML_BYTES,
      'Password form HTML exceeds the request byte budget'
    ),
  inputs: z
    .array(
      z.object({
        type: z.string().max(30),
        domPath: z.string().min(1).max(2000),
        domOrdinal: z.number().int().min(0).max(1000)
      })
    )
    .min(1)
    .max(24)
})

export type PasswordFormSnapshot = z.infer<typeof passwordFormSnapshotSchema>

export const passwordFormResultSchema = z
  .object({
    kind: passwordFormKindSchema,
    currentPasswordIndex: z.number().int().min(0).max(23).nullable(),
    newPasswordIndexes: z.array(z.number().int().min(0).max(23)).max(24),
    usernameIndex: z.number().int().min(0).max(23).nullable()
  })
  .strict()

export type PasswordFormResult = z.infer<typeof passwordFormResultSchema>

export const cachedPasswordFormClassificationSchema = z.object({
  version: z.literal(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  result: passwordFormResultSchema
})

export type CachedPasswordFormClassification = z.infer<
  typeof cachedPasswordFormClassificationSchema
>

export const fingerprintPasswordForm = async (
  snapshot: PasswordFormSnapshot
) => {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

/** The model only returns indexes. Validate them before binding any live field. */
export const isValidPasswordFormResult = (
  result: PasswordFormResult,
  inputs: PasswordFormSnapshot['inputs']
) => {
  const { currentPasswordIndex, newPasswordIndexes, usernameIndex, kind } =
    result
  const passwordIndexes = inputs.flatMap((input, index) =>
    input.type === 'password' ? [index] : []
  )
  const targets = [...newPasswordIndexes]
  if (currentPasswordIndex !== null) targets.push(currentPasswordIndex)
  if (new Set(targets).size !== targets.length) return false
  if (targets.some((index) => !passwordIndexes.includes(index))) return false
  if (
    usernameIndex !== null &&
    !['text', 'email', 'tel'].includes(inputs[usernameIndex]?.type)
  )
    return false
  if (kind === 'UNKNOWN') return targets.length === 0 && usernameIndex === null
  if (targets.length !== passwordIndexes.length) return false
  if (kind === 'LOGIN')
    return currentPasswordIndex !== null && newPasswordIndexes.length === 0
  if (kind === 'SIGNUP')
    return currentPasswordIndex === null && newPasswordIndexes.length > 0
  return currentPasswordIndex !== null && newPasswordIndexes.length > 0
}
