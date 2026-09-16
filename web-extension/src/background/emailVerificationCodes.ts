import browser from 'webextension-polyfill'
import { z } from 'zod'
import { emailCodeFingerprint } from '../email-codes/emailCodeFingerprint'
import { openEmailCodeSource } from './openEmailCodeSource'
import {
  EMAIL_CODE_LIFETIME_MS,
  EMAIL_CODE_EXPIRY_ALARM,
  EMAIL_CODE_STORAGE_KEY,
  EmailCodeMessageKind,
  emailCodeMessageSchema,
  emailVerificationCodesSchema,
  getGmailAccountScope,
  type EmailVerificationCode
} from '../email-codes/emailCodeProtocol'

const stateSchema = z.object({
  entries: emailVerificationCodesSchema,
  // Fingerprints prevent a dismissed/expired email from reappearing after a tab reload.
  seen: z.array(z.string()).max(500)
})
type EmailCodeState = z.infer<typeof stateSchema>
let pending: Promise<unknown> = Promise.resolve()

const updateBadge = async (entries: EmailVerificationCode[]) => {
  const action = browser.action ?? browser.browserAction
  const hasUnreadCode = entries.some((entry) => !entry.copied)
  await action.setBadgeBackgroundColor({ color: '#ef4444' })
  await action.setBadgeText({ text: hasUnreadCode ? '•' : '' })
  await action.setTitle({
    title: hasUnreadCode
      ? 'Authier — email verification code available'
      : 'Authier'
  })
  if (entries.length) {
    await browser.alarms.create(EMAIL_CODE_EXPIRY_ALARM, {
      when: Math.min(...entries.map((entry) => entry.expiresAt))
    })
  } else {
    await browser.alarms.clear(EMAIL_CODE_EXPIRY_ALARM)
  }
}

const updateState = (
  change: (state: EmailCodeState) => void | Promise<void> = () => undefined
): Promise<EmailVerificationCode[]> => {
  // Multiple Gmail tabs and popup actions must not overwrite each other's changes.
  const operation = pending.then(async () => {
    const stored = await browser.storage.session.get(EMAIL_CODE_STORAGE_KEY)
    const state = stateSchema.parse(
      stored[EMAIL_CODE_STORAGE_KEY] ?? { entries: [], seen: [] }
    )
    const before = JSON.stringify(state)
    state.entries = state.entries.filter(
      (entry) => entry.expiresAt > Date.now()
    )
    await change(state)
    state.entries = state.entries.slice(0, 20)
    state.seen = state.seen.slice(-500)
    if (JSON.stringify(state) !== before) {
      await browser.storage.session.set({ [EMAIL_CODE_STORAGE_KEY]: state })
    }
    await updateBadge(state.entries)
    return state.entries
  })
  // Let callers receive the original error while keeping subsequent operations usable.
  pending = operation.then(
    () => undefined,
    () => undefined
  )
  return operation
}

export const refreshEmailVerificationCodes = () => updateState()

/** Handle this namespace before the legacy relay: codes must never reach other tabs. */
export const handleEmailVerificationCodeMessage = (
  message: unknown,
  sender: browser.Runtime.MessageSender
): Promise<EmailVerificationCode[] | boolean | null> | undefined => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('kind' in message) ||
    typeof message.kind !== 'string' ||
    !message.kind.startsWith('authierEmailCode')
  )
    return
  const parsed = emailCodeMessageSchema.safeParse(message)
  if (!parsed.success || sender.id !== browser.runtime.id)
    return Promise.resolve(null)
  const request = parsed.data

  if (request.kind === EmailCodeMessageKind.REPORT) {
    const scope = getGmailAccountScope(sender.url ?? '')
    if (!scope || sender.tab?.id === undefined || sender.frameId !== 0)
      return Promise.resolve(null)
    const source = {
      tabId: sender.tab.id,
      accountUrl: scope,
      incognito: sender.tab.incognito
    }
    return updateState(async (state) => {
      for (const candidate of request.candidates) {
        const key = await emailCodeFingerprint(
          JSON.stringify([
            scope,
            source.incognito,
            candidate.sender.toLowerCase(),
            candidate.code
          ])
        )
        if (state.seen.includes(key)) {
          const existing = state.entries.find(
            (entry) =>
              entry.source?.accountUrl === scope &&
              entry.source.incognito === source.incognito &&
              entry.code === candidate.code &&
              entry.sender.toLowerCase() === candidate.sender.toLowerCase()
          )
          if (existing) existing.source = source
          continue
        }
        const detectedAt = Date.now()
        state.seen.push(key)
        state.entries.unshift({
          ...candidate,
          id: crypto.randomUUID(),
          detectedAt,
          expiresAt: detectedAt + EMAIL_CODE_LIFETIME_MS,
          copied: false,
          source
        })
      }
    }).then(() => true)
  }

  // Only our own extension pages may read codes. The popup router changes its
  // pathname via history.pushState, so checking just /js/popup.html breaks copying.
  if (!sender.url?.startsWith(browser.runtime.getURL('')))
    return Promise.resolve(null)
  if (request.kind === EmailCodeMessageKind.OPEN_SOURCE) {
    return updateState().then((entries) => {
      const entry = entries.find((entry) => entry.id === request.id)
      return entry ? openEmailCodeSource(entry) : false
    })
  }
  return updateState((state) => {
    if (request.kind === EmailCodeMessageKind.DISMISS) {
      state.entries = state.entries.filter((entry) => entry.id !== request.id)
    } else if (request.kind === EmailCodeMessageKind.COPIED) {
      const entry = state.entries.find((entry) => entry.id === request.id)
      if (entry) entry.copied = true
    }
  })
}

export const initializeEmailVerificationCodes = () => {
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === EMAIL_CODE_EXPIRY_ALARM)
      void refreshEmailVerificationCodes()
  })
  browser.storage.onChanged.addListener((changes, area) => {
    if (
      area === 'session' &&
      EMAIL_CODE_STORAGE_KEY in changes &&
      changes[EMAIL_CODE_STORAGE_KEY].newValue === undefined
    ) {
      void refreshEmailVerificationCodes()
    }
  })
  void refreshEmailVerificationCodes()
}
