import { mockDate, unmockDate } from 'proxy-date'
import { beforeAll, afterAll, vi } from 'vitest'
// Import mockzilla dynamically to avoid ES module vs CommonJS conflicts
// import { deepMock } from 'mockzilla'

// Mock browser extension API
import type { Browser } from 'webextension-polyfill'

// We'll set these variables later when we dynamically import mockzilla
let browser: any
let mockBrowser: any
let mockBrowserNode: any

// Mock BroadcastChannel
// @ts-expect-error
window.BroadcastChannel = function BroadcastChannel(name) {}

// Mock location object for browser extension environment
// This is needed because location.href is read-only in jsdom
Object.defineProperty(window, 'location', {
  value: {
    href: 'chrome-extension://mock-extension-id/popup.html',
    pathname: '/popup.html',
    search: '',
    hash: '',
    host: 'mock-extension-id',
    hostname: 'mock-extension-id',
    protocol: 'chrome-extension:',
    origin: 'chrome-extension://mock-extension-id',
    port: '',
    startsWith: function (str: string) {
      return this.href.startsWith(str)
    },
    includes: function (str: string) {
      return this.href.includes(str)
    }
  },
  writable: true
})

// Create a manual mock for browser extension API
const browserMock = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined)
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined)
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getURL: vi
      .fn()
      .mockImplementation(
        (path) => `chrome-extension://mock-extension-id/${path}`
      ),
    getManifest: vi.fn().mockReturnValue({ version: '1.0.0' }),
    connect: vi.fn().mockReturnValue({
      onDisconnect: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
      postMessage: vi.fn()
    })
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    sendMessage: vi.fn().mockResolvedValue(undefined)
  }
}

// Make browser available globally
global.browser = browserMock

// Global setup
beforeAll(() => {
  mockDate('2037-03-03T13:33:33.333Z')

  // Mock webextension-polyfill
  vi.mock('webextension-polyfill', () => {
    return {
      default: browserMock,
      browser: browserMock
    }
  })

  // Mock ExtensionDevice
  vi.mock('@src/background/ExtensionDevice', () => {
    return {
      device: {
        initialize: vi.fn().mockResolvedValue(undefined),
        state: {
          decryptedSecrets: [],
          getAllSecretsDecrypted: vi.fn().mockResolvedValue([]),
          getSecretsDecryptedByTLD: vi.fn().mockResolvedValue([]),
          encrypt: vi.fn().mockResolvedValue('encrypted-string'),
          decrypt: vi.fn().mockResolvedValue('decrypted-string'),
          save: vi.fn().mockResolvedValue(undefined)
        },
        platform: 'Mock OS',
        startLockInterval: vi.fn().mockResolvedValue(undefined),
        clearLockInterval: vi.fn().mockResolvedValue(undefined),
        generateDeviceName: vi.fn().mockReturnValue('Mock Device Name'),
        setLockTime: vi.fn(),
        onInitDone: vi.fn((callback) => callback()),
        id: 'mock-device-id',
        name: 'Mock Device Name',
        lockedState: null,
        fireToken: 'mock-fire-token',
        listenForUserLogin: vi.fn()
      },
      log: vi.fn(),
      isRunningInBgServiceWorker: false,
      getDecryptedSecretProp: vi.fn().mockReturnValue(''),
      extensionDeviceTrpc: {
        setLockInterval: {
          mutate: vi.fn().mockResolvedValue(undefined)
        }
      }
    }
  })
})

// Global teardown
afterAll(() => {
  unmockDate()
  vi.clearAllMocks()
})
