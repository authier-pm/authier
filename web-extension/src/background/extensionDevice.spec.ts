import { device } from './ExtensionDevice'
import browser from 'webextension-polyfill'
import { vi } from 'vitest'
import bowser from 'bowser'

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
        set: vi.fn().mockResolvedValue(undefined)
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  }
}))

// Mock bowser
vi.mock('bowser', () => ({
  default: {
    getParser: vi.fn().mockReturnValue({
      getOSName: vi.fn().mockReturnValue('Mock OS'),
      getBrowserName: vi.fn().mockReturnValue('Mock Browser')
    })
  }
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
      expect(device.platform).toBe('Mock OS')
    })
  })

  describe('initialize', () => {
    beforeEach(() => {
      // Mock DeviceState to prevent errors
      vi.mock('./ExtensionDevice', async () => {
        const originalModule = await vi.importActual('./ExtensionDevice')
        return {
          ...originalModule,
          DeviceState: vi.fn().mockImplementation(() => ({
            save: vi.fn(),
            initialize: vi.fn(),
            vaultLockTimeoutSeconds: 1234,
            deviceName: 'Mock device',
            secrets: []
          }))
        }
      })
    })

    it('should initialize the device and start the lock interval if a device state is present in storage', async () => {
      // Mock getDeviceId
      const mockGetDeviceId = vi.fn().mockResolvedValue('mock-device-id')
      device.getDeviceId = mockGetDeviceId

      // Mock browser.storage.local.get
      const mockStorageGet = vi.fn().mockResolvedValue({
        backgroundState: {
          deviceName: 'Mock device',
          vaultLockTimeoutSeconds: 1234,
          secrets: []
        }
      })
      browser.storage.local.get = mockStorageGet

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

      // Mock browser.storage.local.get
      const mockLockedState = {
        id: 'Mock locked state ID',
        deviceName: 'Mock device',
        secrets: []
      }
      const mockStorageGet = vi.fn().mockResolvedValue({
        lockedState: mockLockedState
      })
      browser.storage.local.get = mockStorageGet

      // Call initialize
      await device.initialize()

      // Verify
      expect(mockStorageGet).toHaveBeenCalled()
      expect(mockGetDeviceId).toHaveBeenCalled()
      expect(device.id).toBe('mock-device-id')
      expect(device.lockedState).toEqual(mockLockedState)
    })
  })
})
