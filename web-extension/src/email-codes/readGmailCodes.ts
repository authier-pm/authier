import {
  EMAIL_CODE_LIFETIME_MS,
  emailCodeCandidateSchema,
  type EmailCodeCandidate
} from './emailCodeProtocol'
import { extractVerificationCode } from './extractVerificationCode'
import { emailCodeFingerprint } from './emailCodeFingerprint'
import { createEmailTextReader } from './readEmailPlainText'

const isKnownOldMessage = (dateElement: Element | null, now: number) => {
  const date = dateElement?.getAttribute('title')
  if (!date) return false
  const timestamp = Date.parse(date)
  // Gmail localizes dates. Unknown formats remain eligible, with a local expiry.
  return Number.isFinite(timestamp) && now - timestamp > EMAIL_CODE_LIFETIME_MS
}

export const readGmailCodes = (
  document: Document,
  now = Date.now()
): EmailCodeCandidate[] => {
  const { isRendered, readText } = createEmailTextReader()
  const candidates: EmailCodeCandidate[] = []
  const addCandidate = (
    sender: string | null,
    body: string,
    subject: string
  ) => {
    const code =
      extractVerificationCode(body, subject) ?? extractVerificationCode(subject)
    const parsed = emailCodeCandidateSchema.safeParse({
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
  report: (candidates: EmailCodeCandidate[]) => Promise<unknown>
): (() => void) => {
  const seen = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  const scan = async () => {
    timer = undefined
    const observed = await Promise.all(
      readGmailCodes(document).map(async (candidate) => ({
        candidate,
        key: await emailCodeFingerprint(JSON.stringify(candidate))
      }))
    )
    if (stopped) return
    const fresh = observed.filter(({ key }) => {
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    // Retain only bounded fingerprints, never a history of plaintext codes.
    for (const key of [...seen].slice(0, Math.max(0, seen.size - 500)))
      seen.delete(key)
    if (!fresh.length) return
    await report(fresh.map(({ candidate }) => candidate)).catch(() => {
      // A temporary background failure may be retried on the next DOM change.
      for (const { key } of fresh) seen.delete(key)
    })
  }
  const schedule = () => {
    if (stopped || timer !== undefined) return
    timer = setTimeout(() => {
      void scan()
    }, 300)
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'email']
  })
  document.defaultView?.addEventListener('hashchange', schedule)
  schedule()
  return () => {
    stopped = true
    clearTimeout(timer)
    observer.disconnect()
    document.defaultView?.removeEventListener('hashchange', schedule)
  }
}
