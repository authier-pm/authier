type BrowserMessage = Record<string, unknown>

let isPagePaused = false
const sessionStorage: Record<string, unknown> = {}

const isBrowserMessage = (message: unknown): message is BrowserMessage =>
  typeof message === 'object' && message !== null

const browser = {
  runtime: {
    sendMessage: async (message: unknown) => {
      if (!isBrowserMessage(message)) {
        return undefined
      }

      if (message.kind === 'AUTOFILL_PAGE_PAUSE_SET') {
        isPagePaused = message.paused === true
      }

      return isPagePaused
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
