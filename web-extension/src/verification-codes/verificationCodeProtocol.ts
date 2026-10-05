import { z } from 'zod'
import {
  relayedCodeSenderSchema,
  relayedCodeSchema
} from '@shared/relayedVerificationCode'

export const VERIFICATION_CODE_STORAGE_KEY = 'verificationCodes'
export const VERIFICATION_CODE_LIFETIME_MS = 10 * 60 * 1000
export const VERIFICATION_CODE_EXPIRY_ALARM = 'expireVerificationCodes'
export const VERIFICATION_CODE_RELAY_ALARM = 'pollRelayedVerificationCodes'
export const VERIFICATION_CODE_RELAY_PERIOD_MINUTES = 0.5
export const GOOGLE_MESSAGES_URL =
  'https://messages.google.com/web/conversations'

export const CodeMessageKind = {
  REPORT: 'authierVerificationCodeReport',
  LIST: 'authierVerificationCodeList',
  SYNC_RELAYED: 'authierVerificationCodeSyncRelayed',
  COPIED: 'authierVerificationCodeCopied',
  LIST_FOR_PAGE: 'authierVerificationCodeListForPage',
  GET_FOR_PAGE: 'authierVerificationCodeGetForPage',
  FILLED_FOR_PAGE: 'authierVerificationCodeFilledForPage',
  OPEN_SOURCE: 'authierVerificationCodeOpenSource',
  DISMISS: 'authierVerificationCodeDismiss',
  DISMISS_MANY: 'authierVerificationCodeDismissMany'
} as const
export const CODE_MESSAGE_PREFIX = 'authierVerificationCode'

const emailCodeSchema = z.string().regex(/^[a-zA-Z0-9]{6,8}$/)

export const gmailCodeCandidateSchema = z.object({
  provider: z.literal('Gmail'),
  sender: z.string().email().max(254),
  code: emailCodeSchema
})
export const googleMessagesCodeCandidateSchema = z.object({
  provider: z.literal('Google Messages'),
  sender: relayedCodeSenderSchema,
  code: relayedCodeSchema
})
export const verificationCodeCandidateSchema = z.discriminatedUnion(
  'provider',
  [gmailCodeCandidateSchema, googleMessagesCodeCandidateSchema]
)
export type VerificationCodeCandidate = z.infer<
  typeof verificationCodeCandidateSchema
>
export type WebCodeProvider = VerificationCodeCandidate['provider']

const entryFields = {
  id: z.string().uuid(),
  detectedAt: z.number(),
  expiresAt: z.number(),
  copied: z.boolean()
}
const tabSourceFields = {
  tabId: z.number().int().nonnegative(),
  incognito: z.boolean()
}

export const verificationCodeSchema = z.discriminatedUnion('provider', [
  gmailCodeCandidateSchema.extend({
    ...entryFields,
    source: z
      .object({
        ...tabSourceFields,
        accountUrl: z
          .string()
          .refine((url) => getGmailAccountScope(url) === url)
      })
      .optional()
  }),
  googleMessagesCodeCandidateSchema.extend({
    ...entryFields,
    source: z.object(tabSourceFields).optional()
  }),
  // Relayed end-to-end encrypted from the user's Android phone via the backend.
  z.object({
    provider: z.literal('Android'),
    sender: relayedCodeSenderSchema,
    code: relayedCodeSchema,
    deviceName: z.string().max(256),
    ...entryFields
  })
])
export const verificationCodesSchema = z.array(verificationCodeSchema)
export type VerificationCode = z.infer<typeof verificationCodeSchema>

/** Only masked suggestions cross into a page before the user chooses a code. */
export const verificationCodeSuggestionSchema = z.object({
  id: entryFields.id,
  provider: z.enum(['Gmail', 'Google Messages', 'Android']),
  sender: z.string(),
  maskedCode: z.string(),
  codeLength: z.number().int().min(4).max(8),
  numeric: z.boolean(),
  expiresAt: entryFields.expiresAt
})
export const verificationCodeSuggestionsSchema = z.array(
  verificationCodeSuggestionSchema
)
export type VerificationCodeSuggestion = z.infer<
  typeof verificationCodeSuggestionSchema
>
export const pageVerificationCodeSchema = z.object({
  code: relayedCodeSchema,
  expiresAt: entryFields.expiresAt
})

const idMessage = <Kind extends string>(kind: Kind) =>
  z.object({ kind: z.literal(kind), id: z.string().uuid() })

export const codeMessageSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(CodeMessageKind.REPORT),
    candidates: z.array(verificationCodeCandidateSchema).max(20)
  }),
  z.object({ kind: z.literal(CodeMessageKind.LIST) }),
  z.object({ kind: z.literal(CodeMessageKind.SYNC_RELAYED) }),
  z.object({ kind: z.literal(CodeMessageKind.LIST_FOR_PAGE) }),
  idMessage(CodeMessageKind.GET_FOR_PAGE),
  idMessage(CodeMessageKind.FILLED_FOR_PAGE),
  idMessage(CodeMessageKind.COPIED),
  idMessage(CodeMessageKind.DISMISS),
  z.object({
    kind: z.literal(CodeMessageKind.DISMISS_MANY),
    ids: z.array(z.string().uuid()).max(20)
  }),
  idMessage(CodeMessageKind.OPEN_SOURCE)
])

export const maskCode = (code: string) => {
  // Short SMS codes reveal less, so a glance cannot give most of it away.
  const visible = code.length > 5 ? 3 : 1
  return code.slice(0, visible) + '*'.repeat(code.length - visible)
}

export const isSmsCode = (entry: VerificationCode) => entry.provider !== 'Gmail'

export const getGmailAccountScope = (url: string): string | null => {
  if (!URL.canParse(url)) return null
  const parsed = new URL(url)
  if (parsed.origin !== 'https://mail.google.com') return null
  const accountPath = parsed.pathname.match(/^\/mail\/(?:u\/[^/]+\/)?/)
  return accountPath ? parsed.origin + accountPath[0] : null
}

export const isGoogleMessagesUrl = (url: string) => {
  if (!URL.canParse(url)) return false
  const parsed = new URL(url)
  return (
    parsed.origin === 'https://messages.google.com' &&
    parsed.pathname.startsWith('/web/')
  )
}
