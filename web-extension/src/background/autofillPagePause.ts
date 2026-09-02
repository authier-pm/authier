import browser from 'webextension-polyfill'

const AUTOFILL_PAUSED_PAGE_STORAGE_KEY_PREFIX = 'autofillPausedPage:'

const pausedPagesInMemory = new Map<number, string>()

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

const getStorageKey = (tabId: number) =>
  `${AUTOFILL_PAUSED_PAGE_STORAGE_KEY_PREFIX}${tabId}`

const getPausedPageUrl = async (tabId: number): Promise<string | null> => {
  const sessionStorage = browser.storage.session

  if (!sessionStorage) {
    return pausedPagesInMemory.get(tabId) ?? null
  }

  const storageKey = getStorageKey(tabId)
  const stored = await sessionStorage.get(storageKey)
  const pausedPageUrl = stored[storageKey]

  return typeof pausedPageUrl === 'string' ? pausedPageUrl : null
}

export const clearAutofillPagePause = async (tabId: number): Promise<void> => {
  pausedPagesInMemory.delete(tabId)

  const sessionStorage = browser.storage.session
  if (sessionStorage) {
    await sessionStorage.remove(getStorageKey(tabId))
  }
}

export const setAutofillPausedForPage = async ({
  paused,
  tabId,
  url
}: Omit<AutofillPagePauseSetMessage, 'kind'>): Promise<void> => {
  if (!paused) {
    await clearAutofillPagePause(tabId)
    return
  }

  const sessionStorage = browser.storage.session
  if (sessionStorage) {
    await sessionStorage.set({ [getStorageKey(tabId)]: url })
    return
  }

  pausedPagesInMemory.set(tabId, url)
}

export const isAutofillPausedForPage = async (
  tabId: number,
  url: string
): Promise<boolean> => {
  const pausedPageUrl = await getPausedPageUrl(tabId)

  if (!pausedPageUrl) {
    return false
  }

  if (pausedPageUrl === url) {
    return true
  }

  await clearAutofillPagePause(tabId)
  return false
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
