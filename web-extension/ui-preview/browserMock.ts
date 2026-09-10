type BrowserMessage = Record<string, unknown>

const pausedDomains = new Set<string>()
const sessionStorage: Record<string, unknown> = {}

const isBrowserMessage = (message: unknown): message is BrowserMessage =>
  typeof message === 'object' && message !== null

const browser = {
  runtime: {
    onMessage: { addListener: () => undefined },
    getURL: () => new URL('../../shared/imgs/logo.svg', import.meta.url).href,
    sendMessage: async (message: unknown) => {
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
    session: {
      get: async (key: string) => ({ [key]: sessionStorage[key] }),
      remove: async (key: string) => {
        delete sessionStorage[key]
      },
      set: async (items: Record<string, unknown>) => {
        Object.assign(sessionStorage, items)
      }
    }
  },
  tabs: {
    sendMessage: async (_tabId: number, _message: unknown) => undefined
  }
}

export default browser
