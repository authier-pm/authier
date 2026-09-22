type BrowserMessage = Record<string, unknown>

const pausedDomains = new Set<string>()
const sessionStorage: Record<string, unknown> = {}
type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>
const storageListeners = new Set<
  (changes: StorageChanges, area: string) => void
>()
const badgeListeners = new Set<() => void>()
const tabListeners = new Set<() => void>()
const gmailTab = {
  id: 42,
  windowId: 7,
  url: 'https://mail.google.com/mail/u/0/#inbox',
  incognito: false
}
let activeTabId = 17
const alarmListeners = new Set<(alarm: { name: string }) => void>()
const alarms = new Map<string, ReturnType<typeof setTimeout>>()
let badgeText = ''
let messageHandler:
  | ((message: unknown) => Promise<unknown> | undefined)
  | undefined
let tabMessageHandler: ((message: unknown) => unknown) | undefined

export const setPreviewTabMessageHandler = (
  handler: typeof tabMessageHandler
) => {
  tabMessageHandler = handler
}

export const setPreviewMessageHandler = (handler: typeof messageHandler) => {
  messageHandler = handler
}
export const getPreviewBadgeText = () => badgeText
export const getPreviewActiveTabId = () => activeTabId
export const subscribePreviewTab = (listener: () => void) => {
  tabListeners.add(listener)
  return () => {
    tabListeners.delete(listener)
  }
}
export const subscribePreviewBadge = (listener: () => void) => {
  badgeListeners.add(listener)
  return () => {
    badgeListeners.delete(listener)
  }
}

const notifyStorageChange = (changes: StorageChanges) => {
  for (const listener of storageListeners) listener(changes, 'session')
}

const isBrowserMessage = (message: unknown): message is BrowserMessage =>
  typeof message === 'object' && message !== null

const browser = {
  runtime: {
    id: 'authier-preview',
    onMessage: { addListener: () => undefined },
    getURL: (path = '') => {
      if (path === '' || path.startsWith('js/'))
        return `chrome-extension://authier-preview/${path}`
      return new URL('../../shared/imgs/logo.svg', import.meta.url).href
    },
    sendMessage: async (message: unknown) => {
      const response = messageHandler?.(message)
      if (response) return response
      if (!isBrowserMessage(message)) {
        return undefined
      }

      const hostname =
        typeof message.url === 'string' ? new URL(message.url).hostname : ''
      if (message.kind === 'AUTOFILL_PAGE_PAUSE_SET') {
        if (message.paused === true) {
          pausedDomains.add(hostname)
        } else {
          pausedDomains.delete(hostname)
        }
      }

      return pausedDomains.has(hostname)
    }
  },
  storage: {
    onChanged: {
      addListener: (
        listener: (changes: StorageChanges, area: string) => void
      ) => {
        storageListeners.add(listener)
      },
      removeListener: (
        listener: (changes: StorageChanges, area: string) => void
      ) => {
        storageListeners.delete(listener)
      }
    },
    session: {
      get: async (key: string) =>
        structuredClone({ [key]: sessionStorage[key] }),
      remove: async (key: string) => {
        const oldValue = sessionStorage[key]
        delete sessionStorage[key]
        notifyStorageChange({ [key]: { oldValue } })
      },
      set: async (items: Record<string, unknown>) => {
        const changes: StorageChanges = {}
        for (const [key, value] of Object.entries(items)) {
          changes[key] = {
            oldValue: sessionStorage[key],
            newValue: structuredClone(value)
          }
          sessionStorage[key] = structuredClone(value)
        }
        notifyStorageChange(changes)
      }
    }
  },
  action: {
    setBadgeBackgroundColor: async (_details: { color: string }) => undefined,
    setBadgeText: async ({ text }: { text: string }) => {
      badgeText = text
      for (const listener of badgeListeners) listener()
    },
    setTitle: async (_details: { title: string }) => undefined
  },
  alarms: {
    onAlarm: {
      addListener: (listener: (alarm: { name: string }) => void) => {
        alarmListeners.add(listener)
      }
    },
    create: async (name: string, { when }: { when: number }) => {
      clearTimeout(alarms.get(name))
      alarms.set(
        name,
        setTimeout(
          () => {
            for (const listener of alarmListeners) listener({ name })
          },
          Math.max(0, when - Date.now())
        )
      )
    },
    clear: async (name: string) => {
      clearTimeout(alarms.get(name))
      return alarms.delete(name)
    }
  },
  tabs: {
    query: async () => [{ ...gmailTab, active: activeTabId === gmailTab.id }],
    update: async (tabId: number, _details: { active: boolean }) => {
      activeTabId = tabId
      for (const listener of tabListeners) listener()
      return { ...gmailTab, active: true }
    },
    create: async (_details: { url: string; active: boolean }) => undefined,
    sendMessage: async (_tabId: number, message: unknown) =>
      tabMessageHandler?.(message)
  },
  windows: {
    update: async (_windowId: number, _details: { focused: boolean }) =>
      undefined,
    create: async (_details: {
      url: string
      incognito: boolean
      focused: boolean
    }) => undefined
  }
}

export default browser
