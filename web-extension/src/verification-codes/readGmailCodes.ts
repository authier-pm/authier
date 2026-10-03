import {
  VERIFICATION_CODE_LIFETIME_MS,
  gmailCodeCandidateSchema,
  type VerificationCodeCandidate
} from './verificationCodeProtocol'
import { extractVerificationCode } from './extractVerificationCode'
import { createRenderedTextReader } from './readRenderedPlainText'
import { observeRenderedCodes } from './observeRenderedCodes'

const isKnownOldMessage = (dateElement: Element | null, now: number) => {
  const date = dateElement?.getAttribute('title')
  if (!date) return false
  const timestamp = Date.parse(date)
  // Gmail localizes dates. Unknown formats remain eligible, with a local expiry.
  return (
    Number.isFinite(timestamp) &&
    now - timestamp > VERIFICATION_CODE_LIFETIME_MS
  )
}

export const readGmailCodes = (
  document: Document,
  now = Date.now()
): VerificationCodeCandidate[] => {
  const { isRendered, readText } = createRenderedTextReader()
  const candidates: VerificationCodeCandidate[] = []
  const addCandidate = (
    sender: string | null,
    body: string,
    subject: string
  ) => {
    const code =
      extractVerificationCode(body, subject) ?? extractVerificationCode(subject)
    const parsed = gmailCodeCandidateSchema.safeParse({
      provider: 'Gmail',
      sender,
      code
    })
    if (
      parsed.success &&
      !candidates.some((item) => item.sender === sender && item.code === code)
    ) {
      candidates.push(parsed.data)
    }
  }

  const subject = readText(document.querySelector('[role="main"] h2.hP'))
  for (const body of [...document.querySelectorAll('[role="main"] .a3s')].slice(
    -20
  )) {
    if (!isRendered(body)) continue
    const message = body.closest('[data-message-id], .adn')
    if (!message || isKnownOldMessage(message.querySelector('.g3[title]'), now))
      continue
    addCandidate(
      message.querySelector('.gD[email]')?.getAttribute('email') ?? null,
      readText(body),
      subject
    )
  }

  // Only unread inbox rows; never open messages, click links or mark mail as read.
  for (const row of [
    ...document.querySelectorAll('[role="main"] tr.zA.zE')
  ].slice(0, 50)) {
    if (
      !isRendered(row) ||
      isKnownOldMessage(row.querySelector('.xW [title]'), now)
    )
      continue
    const senders = [
      ...new Set(
        [...row.querySelectorAll('.yW [email]')].map((element) =>
          element.getAttribute('email')
        )
      )
    ]
    if (senders.length !== 1) continue
    addCandidate(
      senders[0],
      readText(row.querySelector('.y2')),
      readText(row.querySelector('.bog'))
    )
  }
  return candidates.slice(0, 20)
}

export const observeGmailCodes = (
  document: Document,
  report: (candidates: VerificationCodeCandidate[]) => Promise<unknown>
) =>
  observeRenderedCodes(document, readGmailCodes, report, [
    'class',
    'style',
    'hidden',
    'aria-hidden',
    'email'
  ])
