import {
  googleMessagesCodeCandidateSchema,
  type VerificationCodeCandidate
} from './verificationCodeProtocol'
import { extractSmsVerificationCode } from './extractVerificationCode'
import { createRenderedTextReader } from './readRenderedPlainText'
import { observeRenderedCodes } from './observeRenderedCodes'

const conversationName = '[data-e2e-conversation-name]'

export const readGoogleMessagesCodes = (
  document: Document
): VerificationCodeCandidate[] => {
  const { isRendered, readText } = createRenderedTextReader()
  const candidates: VerificationCodeCandidate[] = []
  const add = (senderElement: Element | null, message: Element | null) => {
    const parsed = googleMessagesCodeCandidateSchema.safeParse({
      provider: 'Google Messages',
      sender: readText(senderElement).replace(/\s+/g, ' ').trim(),
      code: extractSmsVerificationCode(readText(message))
    })
    if (
      parsed.success &&
      !candidates.some(
        ({ sender, code }) =>
          sender === parsed.data.sender && code === parsed.data.code
      )
    ) {
      candidates.push(parsed.data)
    }
  }

  // Unread conversation previews, so codes arrive without opening the thread.
  for (const conversation of [
    ...document.querySelectorAll(
      'mws-conversation-list-item a[data-e2e-is-unread="true"]'
    )
  ].slice(0, 50)) {
    if (!isRendered(conversation)) continue
    add(
      conversation.querySelector(conversationName),
      conversation.querySelector('mws-conversation-snippet')
    )
  }

  // Only the open thread's newest message, and only if it was received:
  // earlier messages in the history hold codes that have already expired.
  const latest = [...document.querySelectorAll('mws-message-wrapper')]
    .filter(isRendered)
    .at(-1)
  if (latest?.getAttribute('is-outgoing') === 'false') {
    add(
      document.querySelector(
        `mws-conversation-list-item a.selected ${conversationName}`
      ),
      latest.querySelector('.text-msg')
    )
  }
  return candidates.slice(0, 20)
}

export const observeGoogleMessagesCodes = (
  document: Document,
  report: (candidates: VerificationCodeCandidate[]) => Promise<unknown>
) =>
  observeRenderedCodes(document, readGoogleMessagesCodes, report, [
    'class',
    'style',
    'hidden',
    'aria-hidden',
    'data-e2e-is-unread',
    'is-outgoing'
  ])
