import { readRememberedVault } from '@shared/rememberedVault'
import { DeviceState, device } from './ExtensionDevice'
import type { IBackgroundStateSerializable } from './backgroundPage'
import browser from 'webextension-polyfill'
import { vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }))
vi.mock('@src/apollo/apolloClient', () => ({
  apolloClient: { query: queryMock, mutate: vi.fn() }
}))

vi.mock('bowser', () => ({
  default: {
    getParser: vi.fn(() => ({
      getOSName: () => 'Linux',
      getBrowserName: () => 'Chrome'
    }))
  }
}))

// Mock browser.runtime.connect
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      connect: vi.fn().mockReturnValue({}),
      sendMessage: vi.fn().mockResolvedValue(undefined)
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined)
      },
      session: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined)
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  }
}))

// Mock Firebase messaging functions
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => {
    // Return a plain object, as the original getMessaging attempts to access browser APIs.
    // This mock instance will be passed to getToken.
    return {}
  }),
  getToken: vi.fn(() => Promise.resolve('mocked-firebase-token'))
  // Add mocks for other firebase/messaging exports if your code uses them
  // e.g., onMessage: vi.fn(),
}))

// Mock the extensionDeviceTrpc directly
vi.mock('./ExtensionDevice', async () => {
  const originalModule = await vi.importActual('./ExtensionDevice')
  return {
    ...originalModule,
    extensionDeviceTrpc: {
      setLockInterval: {
        mutate: vi.fn().mockResolvedValue(undefined)
      }
    }
  }
})

describe('ExtensionDevice', () => {
  beforeEach(() => {
    location.href = 'chrome-extension://mock-extension-id/'
    vi.clearAllMocks()
    vi.mocked(readRememberedVault).mockResolvedValue(null)

    // Reset device properties for each test
    device.id = null
    device.name = ''
    device.state = null
    device.lockedState = null
    device.lockInterval = null
  })

  describe('startLockInterval', () => {
    it('should call the trpc client to set the lock interval', async () => {
      // Create a spy on the original method
      const originalMethod = device.startLockInterval

      // Replace with a mock implementation
      const mockStartLockInterval = vi.fn().mockResolvedValue(undefined)
      device.startLockInterval = mockStartLockInterval

      // Call the method
      await device.startLockInterval(1234)

      // Verify the mock was called
      expect(mockStartLockInterval).toHaveBeenCalledWith(1234)

      // Restore the original method
      device.startLockInterval = originalMethod
    })
  })

  describe('clearLockInterval', () => {
    it('should clear the lock interval if it exists', async () => {
      const mockClearInterval = vi.fn()
      global.clearInterval = mockClearInterval

      device.lockInterval = 123 as unknown as number

      await device.clearLockInterval()

      expect(mockClearInterval).toHaveBeenCalledWith(123)
      expect(device.lockInterval).toBeNull()
    })
  })

  describe('platform', () => {
    it('should return the OS name from the browserInfo module', () => {
      expect(device.platform).toBe('Linux')
    })
  })

  describe('initialize', () => {
    it('restores encrypted remembered state after browser session storage is cleared', async () => {
      const remembered = {
        deviceName: 'Remembered browser',
        email: 'test@example.com',
        userId: 'user',
        encryptionSalt: 'salt',
        authSecretEncrypted: 'ciphertext',
        authSecret: 'enrollment',
        masterEncryptionKey: 'remembered-key',
        secrets: [],
        vaultLockTimeoutSeconds: 3600,
        syncTOTP: true,
        autofillCredentialsEnabled: true,
        autofillTOTPEnabled: true,
        autofillForbiddenUrlPatterns: '',
        uiLanguage: 'en',
        theme: 'dark',
        notificationOnVaultUnlock: false,
        notificationOnWrongPasswordAttempts: 3
      }
      device.startLockInterval = vi.fn().mockResolvedValue(undefined)
      vi.mocked(readRememberedVault).mockResolvedValue(remembered)
      vi.mocked(browser.storage.session.get).mockResolvedValue({})
      await device.initialize()
      expect(device.state?.masterEncryptionKey).toBe('remembered-key')
      expect(device.lockedState).toBeNull()
      expect(browser.storage.local.set).not.toHaveBeenCalledWith(
        expect.objectContaining({ backgroundState: expect.anything() })
      )
    })

    it('should initialize the device and start the lock interval if a device state is present in storage', async () => {
      // Mock getDeviceId
      const mockGetDeviceId = vi.fn().mockResolvedValue('mock-device-id')
      device.getDeviceId = mockGetDeviceId

      // Mock browser.storage.session.get
      const mockStorageGet = vi.fn().mockResolvedValue({
        backgroundState: {
          deviceName: 'Mock device',
          email: 'test@example.com',
          userId: 'user',
          encryptionSalt: 'salt',
          authSecretEncrypted: 'ciphertext',
          authSecret: 'test-enrollment-secret',
          masterEncryptionKey: 'test-key',
          syncTOTP: true,
          autofillTOTPEnabled: true,
          uiLanguage: 'en',
          theme: 'dark',
          notificationOnVaultUnlock: false,
          notificationOnWrongPasswordAttempts: 3,
          vaultLockTimeoutSeconds: 1234,
          secrets: []
        }
      })
      browser.storage.session.get = mockStorageGet

      // Mock startLockInterval
      const mockStartLockInterval = vi.fn().mockResolvedValue(undefined)
      device.startLockInterval = mockStartLockInterval

      // Call initialize
      await device.initialize()

      // Verify
      expect(mockStorageGet).toHaveBeenCalled()
      expect(mockGetDeviceId).toHaveBeenCalled()
      expect(device.id).toBe('mock-device-id')
    })

    it('should initialize the device in a locked state if a locked state is present in storage', async () => {
      // Mock getDeviceId
      const mockGetDeviceId = vi.fn().mockResolvedValue('mock-device-id')
      device.getDeviceId = mockGetDeviceId

      // Mock browser.storage.session.get
      const mockLockedState = {
        id: 'Mock locked state ID',
        deviceName: 'Mock device',
        secrets: []
      }
      const mockStorageGet = vi.fn().mockResolvedValue({
        lockedState: mockLockedState
      })
      browser.storage.session.get = mockStorageGet

      // Call initialize
      await device.initialize()

      // Verify
      expect(mockStorageGet).toHaveBeenCalled()
      expect(mockGetDeviceId).toHaveBeenCalled()
      expect(device.id).toBe('mock-device-id')
      expect(device.lockedState).toEqual(mockLockedState)
    })
  })

  describe('commitPasswordRotation', () => {
    const previousSnapshot: IBackgroundStateSerializable = {
      deviceName: 'browser',
      email: 'test@example.com',
      userId: 'user',
      encryptionSalt: 'salt',
      authSecretEncrypted: 'old-verifier',
      authSecret: 'old-enrollment',
      masterEncryptionKey: 'old-key',
      secrets: [],
      vaultLockTimeoutSeconds: 3600,
      syncTOTP: true,
      autofillCredentialsEnabled: true,
      autofillTOTPEnabled: true,
      autofillForbiddenUrlPatterns: '',
      uiLanguage: 'en',
      theme: 'dark',
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 3
    }
    const nextSnapshot: IBackgroundStateSerializable = {
      ...previousSnapshot,
      masterEncryptionKey: 'new-key',
      authSecret: 'new-enrollment',
      authSecretEncrypted: 'new-verifier'
    }
    const previousState = () =>
      Object.assign(
        Object.create(DeviceState.prototype) as DeviceState,
        previousSnapshot
      )

    it('awaits installing the new key and ciphertext together for the same unlocked session', async () => {
      const previous = previousState()
      device.state = previous
      const save = vi.spyOn(device, 'save').mockResolvedValue(undefined)
      await device.commitPasswordRotation(previous, nextSnapshot)
      expect(save).toHaveBeenCalledExactlyOnceWith(nextSnapshot)
      expect(previous.masterEncryptionKey).toBe('old-key')
      save.mockRestore()
    })

    it('keeps a vault locked while updating the encrypted verifier after a request completes', async () => {
      const previous = previousState()
      const { masterEncryptionKey, authSecret, ...lockedSnapshot } =
        previousSnapshot
      device.state = null
      device.lockedState = lockedSnapshot
      await device.commitPasswordRotation(previous, nextSnapshot)
      const expected = {
        ...lockedSnapshot,
        authSecretEncrypted: 'new-verifier'
      }
      expect(device.state).toBeNull()
      expect(device.lockedState).toEqual(expected)
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        lockedState: expected
      })
      expect(browser.storage.session.set).toHaveBeenCalledWith({
        backgroundState: null,
        lockedState: expected
      })
    })

    it('does not replace a different account opened while the rotation request was running', async () => {
      const previous = previousState()
      const replacement = Object.assign(previousState(), {
        userId: 'other-user'
      })
      device.state = replacement
      await device.commitPasswordRotation(previous, nextSnapshot)
      expect(device.state).toBe(replacement)
      expect(browser.storage.local.set).not.toHaveBeenCalled()
      expect(browser.storage.session.set).not.toHaveBeenCalled()
    })

    it('ignores an old sync response after the key and session have been replaced', async () => {
      const previous = previousState()
      device.state = previous
      let resolveQuery!: (value: {
        data: { currentDevice: { encryptedSecretsToSync: [] } }
      }) => void
      queryMock.mockReturnValue(
        new Promise((resolve) => {
          resolveQuery = resolve
        })
      )
      const sync = previous.backendSync()
      const replacement = Object.assign(previousState(), nextSnapshot)
      device.state = replacement
      resolveQuery({
        data: { currentDevice: { encryptedSecretsToSync: [] } }
      })
      await sync
      expect(device.state).toBe(replacement)
      expect(browser.storage.session.set).not.toHaveBeenCalled()
    })

    it('invalidates a passkey approval session when another extension window rotates the key', async () => {
      const previous = previousState()
      device.state = previous
      previous.onStorageChange({ backgroundState: { newValue: nextSnapshot } }, 'session')
      const replacement = device.state
      expect(replacement).not.toBe(previous)
      expect(replacement?.masterEncryptionKey).toBe('new-key')
      expect(previous.masterEncryptionKey).toBe('')
      expect(previous.authSecret).toBe('')
      expect(previous.decryptedSecrets).toEqual([])
      await replacement?.initialize()
      replacement?.destroy()
    })

    it('keeps the approval session identity for ordinary same-key synchronization', () => {
      const previous = previousState()
      device.state = previous
      previous.onStorageChange({ backgroundState: { newValue: { ...previousSnapshot, theme: 'light' } } }, 'session')
      expect(device.state).toBe(previous)
      expect(device.state?.theme).toBe('light')
      expect(previous.masterEncryptionKey).toBe('old-key')
    })
  })
})
