import { device } from './ExtensionDevice'
import browser from 'webextension-polyfill'

describe('ExtensionDevice', () => {
  describe('startLockInterval', () => {
    it('should send a message to the background page to set the lock interval', async () => {
      const mockRuntimeSendMessage = jest.fn()
      browser.runtime.sendMessage = mockRuntimeSendMessage

      await device.startLockInterval(1234)
      expect(mockRuntimeSendMessage).toHaveBeenCalledWith({
        action: 'setLockInterval',
        time: 1234
      })
    })
  })

  describe('clearLockInterval', () => {
    it('should send a message to the background page to clear the lock interval', async () => {
      const mockRuntimeSendMessage = jest.fn()
      browser.runtime.sendMessage = mockRuntimeSendMessage

      await device.clearLockInterval()
      expect(mockRuntimeSendMessage).toHaveBeenCalledWith({
        action: 'clearLockInterval'
      })
    })
  })

  describe('platform', () => {
    it('should return the OS name from the browserInfo module', () => {
      const mockOSName = 'Mock OS'
      jest.mock('./browserInfo', () => ({
        getOSName: () => mockOSName
      }))

      expect(device.platform).toBe(mockOSName)
    })
  })

  describe('initialize', () => {
    it('should initialize the device and start the lock interval if a device state is present in storage', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        backgroundState: {
          deviceName: 'Mock device',
          lockTime: 1234
        }
      })
      browser.storage.local.get = mockGet

      const mockStartLockInterval = jest.fn()
      device.startLockInterval = mockStartLockInterval

      await device.initialize()

      expect(mockGet).toHaveBeenCalled()
      expect(device.state).toBeTruthy()
      expect(device.name).toBe('Mock device')
      expect(mockStartLockInterval).toHaveBeenCalledWith(1234)
    })

    it('should initialize the device in a locked state if a locked state is present in storage', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        lockedState: {
          id: 'Mock locked state ID'
        }
      })
      browser.storage.local.get = mockGet

      const mockGenerateDeviceName = jest
        .fn()
        .mockReturnValue('Mock device name')
      device.generateDeviceName = mockGenerateDeviceName

      await device.initialize()

      expect(mockGet).toHaveBeenCalled()
      expect(device.state).toBeFalsy()
      expect(device.lockedState).toEqual
    })
  })
})
