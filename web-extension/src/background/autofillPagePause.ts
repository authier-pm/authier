import browser from 'webextension-polyfill'

export const AutofillPagePauseMessageKind = {
  GET: 'AUTOFILL_PAGE_PAUSE_GET',
  SET: 'AUTOFILL_PAGE_PAUSE_SET',
  REFRESH: 'AUTOFILL_PAGE_PAUSE_REFRESH'
} as const

export type AutofillPagePauseGetMessage = {
  kind: typeof AutofillPagePauseMessageKind.GET
  tabId: number
  url: string
}

export type AutofillPagePauseSetMessage = {
  kind: typeof AutofillPagePauseMessageKind.SET
  paused: boolean
  tabId: number
  url: string
}

export type AutofillPagePauseRefreshMessage = {
  kind: typeof AutofillPagePauseMessageKind.REFRESH
}

// Keep the message protocol stable; pauses now belong to a hostname, not a tab.
export const getAutofillPauseHostname = (url: string): string | null => {
  if (!URL.canParse(url)) {
    return null
  }

  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null
  }

  return parsed.hostname
}

const getStorageKey = (url: string): string | null => {
  const hostname = getAutofillPauseHostname(url)
  return hostname ? `autofillPausedDomain:${hostname}` : null
}

export const setAutofillPausedForPage = async ({
  paused,
  url
}: Omit<AutofillPagePauseSetMessage, 'kind'>): Promise<void> => {
  const storageKey = getStorageKey(url)
  if (!storageKey) {
    return
  }

  if (paused) {
    await browser.storage.local.set({ [storageKey]: true })
  } else {
    await browser.storage.local.remove(storageKey)
  }
}

export const isAutofillPausedForPage = async (
  _tabId: number,
  url: string
): Promise<boolean> => {
  const storageKey = getStorageKey(url)
  if (!storageKey) {
    return false
  }

  const stored = await browser.storage.local.get(storageKey)
  return stored[storageKey] === true
}

export const refreshAutofillForDomain = async (url: string): Promise<void> => {
  const hostname = getAutofillPauseHostname(url)
  if (!hostname) {
    return
  }

  const tabs = await browser.tabs.query({})
  await Promise.all(
    tabs
      .filter((tab) => getAutofillPauseHostname(tab.url ?? '') === hostname)
      .map((tab) => {
        if (typeof tab.id !== 'number') {
          return
        }

        // Tabs without a content script (or closed during the query) cannot receive it.
        return browser.tabs
          .sendMessage(tab.id, { kind: AutofillPagePauseMessageKind.REFRESH })
          .catch(() => undefined)
      })
  )
}

const isMessageWithKind = (message: unknown): message is { kind: unknown } =>
  typeof message === 'object' && message !== null && 'kind' in message

export const isAutofillPagePauseGetMessage = (
  message: unknown
): message is AutofillPagePauseGetMessage =>
  isMessageWithKind(message) &&
  message.kind === AutofillPagePauseMessageKind.GET &&
  'tabId' in message &&
  typeof message.tabId === 'number' &&
  'url' in message &&
  typeof message.url === 'string'

export const isAutofillPagePauseSetMessage = (
  message: unknown
): message is AutofillPagePauseSetMessage =>
  isMessageWithKind(message) &&
  message.kind === AutofillPagePauseMessageKind.SET &&
  'paused' in message &&
  typeof message.paused === 'boolean' &&
  'tabId' in message &&
  typeof message.tabId === 'number' &&
  'url' in message &&
  typeof message.url === 'string'

export const isAutofillPagePauseRefreshMessage = (
  message: unknown
): message is AutofillPagePauseRefreshMessage =>
  isMessageWithKind(message) &&
  message.kind === AutofillPagePauseMessageKind.REFRESH
