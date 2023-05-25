import { act } from '@testing-library/react-native'
import messaging from '@react-native-firebase/messaging'
import SInfo from 'react-native-sensitive-info'
import { getUniqueId } from 'react-native-device-info'
import { useStore } from './deviceStore'
import { useTestStore } from './deviceStateStore'

jest.mock('@react-native-firebase/messaging', () => ({
  getToken: jest.fn()
}))

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn()
}))

jest.mock('react-native-sensitive-info', () => ({
  isSensorAvailable: jest.fn()
}))

describe('Device Store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have the initial state', () => {
    const store = useStore.getState()
    expect(store.fireToken).toBeNull()
    expect(store.lockedState).toBeNull()
    expect(store.id).toBeNull()
    expect(store.name).toBe('')
    expect(store.biometricsAvailable).toBeFalsy()
    expect(store.isInitialized).toBeFalsy()
    expect(store.isLocked).toBeFalsy()
    expect(store.isLoggedIn).toBeFalsy()
  })

  it('should save state', () => {
    act(() => {
      useStore.getState().save({
        masterEncryptionKey: 'abc',
        email: 'test',
        theme: 'light',
        userId: '123',
        secrets: [],
        lockTime: 0,
        syncTOTP: false,
        authSecret: 'test',
        deviceName: 'ttest',
        uiLanguage: 'en',
        lockTimeEnd: 0,
        encryptionSalt: 'test',
        biometricsEnabled: false,
        authSecretEncrypted: 'test',
        autofillTOTPEnabled: false,
        autofillCredentialsEnabled: false
      })
    })

    const { userId } = useTestStore.getState()
    expect(userId).toBe('123')
  })

  // it('should initialize device', async () => {
  //   // getUniqueId.mockImplementation(() => Promise.resolve('uniqueId'))
  //   // messaging().getToken.mockImplementation(() => Promise.resolve('token'))
  //   // SInfo.isSensorAvailable.mockImplementation(() => Promise.resolve(true))
  //
  //   let result
  //   await act(async () => {
  //     result = await useStore.getState().initialize()
  //   })
  //
  //   const { id, fireToken, biometricsAvailable, isInitialized, platform } =
  //     useStore.getState()
  //
  //   expect(result).not.toBeNull()
  //   expect(id).toBe('uniqueId')
  //   expect(fireToken).toBe('token')
  //   expect(biometricsAvailable).toBeTruthy()
  //   expect(isInitialized).toBeTruthy()
  //   expect(platform).toBe('ios')
  // })
})
