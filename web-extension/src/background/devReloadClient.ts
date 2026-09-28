import browser from 'webextension-polyfill'

const reloadTabStorageKey = 'authierDevReloadTabId'
const reconnectDelayMs = 1000

/**
 * Development only: reloads the extension whenever `pnpm dev` rebuilds the background or content scripts.
 * The page that was active gets reloaded as well, so it runs the fresh content script.
 */
export function connectDevReloadServer(url: string) {
  const startedAt = Date.now()
  let reloading = false

  const reloadExtension = async () => {
    reloading = true
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true
    })
    if (tab?.id !== undefined && tab.url?.startsWith('http')) {
      await browser.storage.local.set({ [reloadTabStorageKey]: tab.id })
    }
    browser.runtime.reload()
  }

  const connect = () => {
    const socket = new WebSocket(url)
    socket.addEventListener('message', (event) => {
      const { builtAt } = JSON.parse(event.data) as { builtAt: number }
      if (builtAt > startedAt && !reloading) {
        void reloadExtension()
      }
    })
    socket.addEventListener('close', () => {
      setTimeout(connect, reconnectDelayMs)
    })
  }

  void reloadTabAfterExtensionReload()
  connect()
}

async function reloadTabAfterExtensionReload() {
  const stored = await browser.storage.local.get(reloadTabStorageKey)
  const tabId = stored[reloadTabStorageKey]
  if (typeof tabId !== 'number') return

  await browser.storage.local.remove(reloadTabStorageKey)
  await browser.tabs.reload(tabId)
}
