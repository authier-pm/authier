import type browser from 'webextension-polyfill'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import {
  maskCode,
  type VerificationCode,
  type VerificationCodeSuggestion
} from '../verification-codes/verificationCodeProtocol'

/** Inline suggestions are only available to our top-level HTTPS content script. */
export const getVerificationCodePage = (
  sender: browser.Runtime.MessageSender
): { domain: string; incognito: boolean } | null => {
  if (
    sender.frameId !== 0 ||
    sender.tab?.id === undefined ||
    !sender.url ||
    !URL.canParse(sender.url)
  )
    return null
  const url = new URL(sender.url)
  if (url.protocol !== 'https:') return null
  const domain = getDomainNameAndTldFromUrl(url.href)
  return domain ? { domain, incognito: sender.tab.incognito } : null
}

export const isVerificationCodeForPage = (
  entry: VerificationCode,
  page: NonNullable<ReturnType<typeof getVerificationCodePage>>
) => {
  const incognito = 'source' in entry && entry.source?.incognito === true
  if (incognito !== page.incognito) return false
  // SMS sender IDs and phone numbers have no reliable relationship to a domain.
  // Offer these as masked choices, and only release the selected code on click.
  if (entry.provider !== 'Gmail') return true
  const senderDomain = entry.sender.split('@')[1]
  return getDomainNameAndTldFromUrl(senderDomain) === page.domain
}

export const toVerificationCodeSuggestion = (
  entry: VerificationCode
): VerificationCodeSuggestion => ({
  id: entry.id,
  provider: entry.provider,
  sender: entry.sender,
  maskedCode: maskCode(entry.code),
  codeLength: entry.code.length,
  numeric: /^\d+$/.test(entry.code),
  expiresAt: entry.expiresAt
})
