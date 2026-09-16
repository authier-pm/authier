import { z } from 'zod'

export const EMAIL_CODE_STORAGE_KEY = 'emailVerificationCodes'
export const EMAIL_CODE_LIFETIME_MS = 10 * 60 * 1000
export const EMAIL_CODE_EXPIRY_ALARM = 'expireEmailVerificationCodes'

export const EmailCodeMessageKind = {
  REPORT: 'authierEmailCodeReport',
  LIST: 'authierEmailCodeList',
  COPIED: 'authierEmailCodeCopied',
  OPEN_SOURCE: 'authierEmailCodeOpenSource',
  DISMISS: 'authierEmailCodeDismiss'
} as const

export const emailCodeCandidateSchema = z.object({
  provider: z.literal('Gmail'),
  sender: z.string().email().max(254),
  code: z.string().regex(/^[a-zA-Z0-9]{6,8}$/)
})

export type EmailCodeCandidate = z.infer<typeof emailCodeCandidateSchema>

export const emailVerificationCodeSchema = emailCodeCandidateSchema.extend({
  id: z.string().uuid(),
  detectedAt: z.number(),
  expiresAt: z.number(),
  copied: z.boolean(),
  source: z
    .object({
      tabId: z.number().int().nonnegative(),
      accountUrl: z.string().refine((url) => getGmailAccountScope(url) === url),
      incognito: z.boolean()
    })
    .optional()
})

export const emailVerificationCodesSchema = z.array(emailVerificationCodeSchema)
export type EmailVerificationCode = z.infer<typeof emailVerificationCodeSchema>

export const emailCodeMessageSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(EmailCodeMessageKind.REPORT),
    candidates: z.array(emailCodeCandidateSchema).max(20)
  }),
  z.object({ kind: z.literal(EmailCodeMessageKind.LIST) }),
  z.object({
    kind: z.literal(EmailCodeMessageKind.COPIED),
    id: z.string().uuid()
  }),
  z.object({
    kind: z.literal(EmailCodeMessageKind.DISMISS),
    id: z.string().uuid()
  }),
  z.object({
    kind: z.literal(EmailCodeMessageKind.OPEN_SOURCE),
    id: z.string().uuid()
  })
])

export const maskEmailCode = (code: string) =>
  code.slice(0, 3) + '*'.repeat(code.length - 3)

export const getGmailAccountScope = (url: string): string | null => {
  if (!URL.canParse(url)) return null
  const parsed = new URL(url)
  if (parsed.origin !== 'https://mail.google.com') return null
  const accountPath = parsed.pathname.match(/^\/mail\/(?:u\/[^/]+\/)?/)
  return accountPath ? parsed.origin + accountPath[0] : null
}
