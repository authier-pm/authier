import browser from 'webextension-polyfill'
import { z } from 'zod'
import type { RelayedCodePayload } from '@shared/relayedVerificationCode'
import { codeFingerprint } from '../verification-codes/codeFingerprint'
import { openCodeSource } from './openCodeSource'
import {
<<<<<<< HEAD
  getVerificationCodePage,
  isVerificationCodeForPage,
  toVerificationCodeSuggestion
} from './verificationCodesForPage'
import {
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  CODE_MESSAGE_PREFIX,
  VERIFICATION_CODE_LIFETIME_MS,
  VERIFICATION_CODE_EXPIRY_ALARM,
  VERIFICATION_CODE_STORAGE_KEY,
<<<<<<< HEAD
  VERIFICATION_CODE_RELAY_ALARM,
  VERIFICATION_CODE_RELAY_PERIOD_MINUTES,
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  CodeMessageKind,
  codeMessageSchema,
  getGmailAccountScope,
  isGoogleMessagesUrl,
  verificationCodeSchema,
  verificationCodesSchema,
  type VerificationCode,
<<<<<<< HEAD
  type VerificationCodeSuggestion,
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  type WebCodeProvider
} from '../verification-codes/verificationCodeProtocol'

const stateSchema = z.object({
  entries: verificationCodesSchema,
  // Fingerprints prevent a dismissed/expired code from reappearing after a tab
  // reload or the next poll of phone-relayed codes.
  seen: z.array(z.string()).max(500)
})
type CodeState = z.infer<typeof stateSchema>

/** A phone-relayed code, already decrypted with the unlocked vault key. */
export type RelayedVerificationCode = RelayedCodePayload & {
  id: string
  deviceName: string
  expiresAt: number
}
type FetchRelayedCodes = () => Promise<RelayedVerificationCode[]>

let pending: Promise<unknown> = Promise.resolve()
let fetchRelayedCodes: FetchRelayedCodes = async () => []
let relaySync: Promise<VerificationCode[]> | null = null

const GOOGLE_MESSAGES_SCOPE = 'https://messages.google.com/web/'

const updateBadge = async (entries: VerificationCode[]) => {
  const action = browser.action ?? browser.browserAction
  const hasUnreadCode = entries.some((entry) => !entry.copied)
  await action.setBadgeBackgroundColor({ color: '#ef4444' })
  await action.setBadgeText({ text: hasUnreadCode ? '•' : '' })
  await action.setTitle({
    title: hasUnreadCode ? 'Authier — verification code available' : 'Authier'
  })
  if (entries.length) {
    await browser.alarms.create(VERIFICATION_CODE_EXPIRY_ALARM, {
      when: Math.min(...entries.map((entry) => entry.expiresAt))
    })
  } else {
    await browser.alarms.clear(VERIFICATION_CODE_EXPIRY_ALARM)
  }
}

const updateState = (
  change: (state: CodeState) => void | Promise<void> = () => undefined
): Promise<VerificationCode[]> => {
  // Multiple web app tabs, relay polls and popup actions must not overwrite each other.
  const operation = pending.then(async () => {
    const stored = await browser.storage.session.get(
      VERIFICATION_CODE_STORAGE_KEY
    )
    const state = stateSchema.parse(
      stored[VERIFICATION_CODE_STORAGE_KEY] ?? { entries: [], seen: [] }
    )
    const before = JSON.stringify(state)
    state.entries = state.entries.filter(
      (entry) => entry.expiresAt > Date.now()
    )
    await change(state)
    state.entries = state.entries.slice(0, 20)
    state.seen = state.seen.slice(-500)
    if (JSON.stringify(state) !== before) {
      await browser.storage.session.set({
        [VERIFICATION_CODE_STORAGE_KEY]: state
      })
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

type ReportOrigin = {
  provider: WebCodeProvider
  scope: string
  source: { tabId: number; incognito: boolean; accountUrl?: string }
}

/** Which web app sent a report; codes are only accepted from their own app. */
const getReportOrigin = (
  sender: browser.Runtime.MessageSender
): ReportOrigin | null => {
  const tabId = sender.tab?.id
  if (tabId === undefined || sender.frameId !== 0) return null
  const url = sender.url ?? ''
  const incognito = sender.tab?.incognito ?? false
  const accountUrl = getGmailAccountScope(url)
  if (accountUrl)
    return {
      provider: 'Gmail',
      scope: accountUrl,
      source: { tabId, accountUrl, incognito }
    }
  if (isGoogleMessagesUrl(url))
    return {
      provider: 'Google Messages',
      scope: GOOGLE_MESSAGES_SCOPE,
      source: { tabId, incognito }
    }
  return null
}

const getEntryScope = (entry: VerificationCode) => {
  if (entry.provider === 'Gmail') return entry.source?.accountUrl
  if (entry.provider === 'Google Messages') return GOOGLE_MESSAGES_SCOPE
  return undefined
}

const addRelayedCodes = async (
  state: CodeState,
  relayedCodes: RelayedVerificationCode[]
) => {
  for (const relayed of relayedCodes) {
    const key = await codeFingerprint(JSON.stringify(['Android', relayed.id]))
    if (state.seen.includes(key)) continue
    state.seen.push(key)
    const detectedAt = Date.now()
    state.entries.unshift(
      verificationCodeSchema.parse({
        provider: 'Android',
        sender: relayed.sender,
        code: relayed.code,
        deviceName: relayed.deviceName,
        id: crypto.randomUUID(),
        detectedAt,
        // Bound by local time too, in case this computer's clock lags the server.
        expiresAt: Math.min(
          relayed.expiresAt,
          detectedAt + VERIFICATION_CODE_LIFETIME_MS
        ),
        copied: false
      })
    )
  }
}

const syncRelayedCodes = () => {
<<<<<<< HEAD
  // Background alarms, popup and inline polls share a single backend request.
=======
  // The popup polls; never stack requests while the backend is slow.
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  relaySync ??= fetchRelayedCodes()
    .then((relayedCodes) =>
      updateState((state) => addRelayedCodes(state, relayedCodes))
    )
    .finally(() => {
      relaySync = null
    })
  return relaySync
}

export const refreshVerificationCodes = () => updateState()

/** Handle this namespace before the legacy relay: codes must never reach other tabs. */
export const handleVerificationCodeMessage = (
  message: unknown,
  sender: browser.Runtime.MessageSender
<<<<<<< HEAD
):
  | Promise<
      | VerificationCode[]
      | VerificationCodeSuggestion[]
      | { code: string; expiresAt: number }
      | boolean
      | null
    >
  | undefined => {
=======
): Promise<VerificationCode[] | boolean | null> | undefined => {
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  if (
    typeof message !== 'object' ||
    message === null ||
    !('kind' in message) ||
    typeof message.kind !== 'string' ||
    !message.kind.startsWith(CODE_MESSAGE_PREFIX)
  )
    return
  const parsed = codeMessageSchema.safeParse(message)
  if (!parsed.success || sender.id !== browser.runtime.id)
    return Promise.resolve(null)
  const request = parsed.data

  if (request.kind === CodeMessageKind.REPORT) {
    const origin = getReportOrigin(sender)
    if (!origin) return Promise.resolve(null)
    const { incognito } = origin.source
    return updateState(async (state) => {
      for (const candidate of request.candidates) {
        // A content script can only report codes from the app it runs in.
        if (candidate.provider !== origin.provider) continue
        const sameCode = (entry: VerificationCode) =>
          entry.provider === candidate.provider &&
          getEntryScope(entry) === origin.scope &&
          'source' in entry &&
          entry.source?.incognito === incognito &&
          entry.code === candidate.code &&
          entry.sender.toLowerCase() === candidate.sender.toLowerCase()
        const key = await codeFingerprint(
          JSON.stringify([
            origin.scope,
            incognito,
            candidate.sender.toLowerCase(),
            candidate.code
          ])
        )
        if (state.seen.includes(key)) {
          const index = state.entries.findIndex(sameCode)
          if (index !== -1)
            state.entries[index] = verificationCodeSchema.parse({
              ...state.entries[index],
              source: origin.source
            })
          continue
        }
        const detectedAt = Date.now()
        state.seen.push(key)
        state.entries.unshift(
          verificationCodeSchema.parse({
            ...candidate,
            id: crypto.randomUUID(),
            detectedAt,
            expiresAt: detectedAt + VERIFICATION_CODE_LIFETIME_MS,
            copied: false,
            source: origin.source
          })
        )
      }
    }).then(() => true)
  }

<<<<<<< HEAD
  if (
    request.kind === CodeMessageKind.LIST_FOR_PAGE ||
    request.kind === CodeMessageKind.GET_FOR_PAGE ||
    request.kind === CodeMessageKind.FILLED_FOR_PAGE
  ) {
    const page = getVerificationCodePage(sender)
    if (!page) return Promise.resolve(null)
    const acknowledgeFill = (state: CodeState) => {
      if (request.kind !== CodeMessageKind.FILLED_FOR_PAGE) return
      const entry = state.entries.find(
        (entry) =>
          entry.id === request.id && isVerificationCodeForPage(entry, page)
      )
      if (entry) entry.copied = true
    }
    // Keep cached choices immediate even when the phone relay is slow. A new
    // relay appears on the next dropdown poll; offline checks are retried then.
    if (request.kind === CodeMessageKind.LIST_FOR_PAGE)
      void syncRelayedCodes().then(undefined, () => undefined)
    return updateState(acknowledgeFill).then((entries) => {
      const matching = entries.filter((entry) =>
        isVerificationCodeForPage(entry, page)
      )
      if (request.kind === CodeMessageKind.LIST_FOR_PAGE)
        return matching.map(toVerificationCodeSuggestion)
      const entry = matching.find((entry) => entry.id === request.id)
      if (request.kind === CodeMessageKind.FILLED_FOR_PAGE) return !!entry
      return entry ? { code: entry.code, expiresAt: entry.expiresAt } : null
    })
  }

=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  // Only our own extension pages may read codes. The popup router changes its
  // pathname via history.pushState, so checking just /js/popup.html breaks copying.
  if (!sender.url?.startsWith(browser.runtime.getURL('')))
    return Promise.resolve(null)
  if (request.kind === CodeMessageKind.SYNC_RELAYED) return syncRelayedCodes()
  if (request.kind === CodeMessageKind.OPEN_SOURCE) {
    return updateState().then((entries) => {
      const entry = entries.find((entry) => entry.id === request.id)
      return entry ? openCodeSource(entry) : false
    })
  }
  return updateState((state) => {
    if (request.kind === CodeMessageKind.DISMISS) {
      state.entries = state.entries.filter((entry) => entry.id !== request.id)
    } else if (request.kind === CodeMessageKind.COPIED) {
      const entry = state.entries.find((entry) => entry.id === request.id)
      if (entry) entry.copied = true
    }
  })
}

export const initializeVerificationCodes = (
<<<<<<< HEAD
  options: {
    fetchRelayedCodes?: FetchRelayedCodes
    pollRelayedInBackground?: boolean
  } = {}
) => {
  if (options.fetchRelayedCodes) fetchRelayedCodes = options.fetchRelayedCodes
  const syncInBackground = () =>
    syncRelayedCodes().catch((error: unknown) => {
      // Keep cached codes and retry at the next alarm when offline.
      console.warn('Could not check for codes from your phone', error)
    })
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === VERIFICATION_CODE_EXPIRY_ALARM)
      void refreshVerificationCodes()
    if (
      options.pollRelayedInBackground &&
      alarm.name === VERIFICATION_CODE_RELAY_ALARM
    )
      return syncInBackground()
  })
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'session') return
    const session = changes.backgroundState
    if (
      options.pollRelayedInBackground &&
      session?.newValue &&
      !session.oldValue
    )
      void syncInBackground()
    if (
=======
  options: { fetchRelayedCodes?: FetchRelayedCodes } = {}
) => {
  if (options.fetchRelayedCodes) fetchRelayedCodes = options.fetchRelayedCodes
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === VERIFICATION_CODE_EXPIRY_ALARM)
      void refreshVerificationCodes()
  })
  browser.storage.onChanged.addListener((changes, area) => {
    if (
      area === 'session' &&
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
      VERIFICATION_CODE_STORAGE_KEY in changes &&
      changes[VERIFICATION_CODE_STORAGE_KEY].newValue === undefined
    ) {
      void refreshVerificationCodes()
    }
  })
  void refreshVerificationCodes()
<<<<<<< HEAD
  if (!options.pollRelayedInBackground) return Promise.resolve()
  // Alarms can disappear on restart/update. Do not reset an existing schedule
  // each time Chrome wakes the service worker for an event.
  return browser.alarms
    .get(VERIFICATION_CODE_RELAY_ALARM)
    .then(async (alarm) => {
      if (!alarm)
        await browser.alarms.create(VERIFICATION_CODE_RELAY_ALARM, {
          periodInMinutes: VERIFICATION_CODE_RELAY_PERIOD_MINUTES
        })
      await syncInBackground()
    })
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
}
