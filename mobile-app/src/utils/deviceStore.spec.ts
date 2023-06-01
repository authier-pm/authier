import { act } from '@testing-library/react-native'
import { useDeviceStore } from './deviceStore'
import { useDeviceStateStore } from './deviceStateStore'

describe('Device Store', () => {
  it('should have the initial state', () => {
    const store = useDeviceStore.getState()
    expect(store.fireToken).toBeNull()
    expect(store.lockedState).toBeNull()
    expect(store.id).toBeNull()
    expect(store.name).toBe('')
    expect(store.biometricsAvailable).toBeFalsy()
    expect(store.isInitialized).toBeFalsy()
    expect(store.isLoggedIn).toBeFalsy()
  })

  // it('should initialize the store', async () => {
  //   await act(async () => {
  //     await useDeviceStore.getState().initialize()
  //   })
  //   const { isInitialized, fireToken } = useDeviceStore.getState()

  //   expect(isInitialized).toBeTruthy()
  //   expect(fireToken).toBe('myMockToken')
  // })

  // it('should save state', async () => {
  //   await act(async () => {
  //     await useDeviceStore.getState().save({
  //       masterEncryptionKey: 'abc',
  //       email: 'test',
  //       theme: 'light',
  //       userId: '123',
  //       secrets: [],
  //       vaultLockTimeoutSeconds: 0,
  //       syncTOTP: true,
  //       authSecret: 'test',
  //       deviceName: 'ttest',
  //       uiLanguage: 'en',
  //       lockTimeEnd: 0,
  //       encryptionSalt: 'test',
  //       biometricsEnabled: false,
  //       authSecretEncrypted: 'test',
  //       autofillTOTPEnabled: true,
  //       autofillCredentialsEnabled: false
  //     })
  //   })

  //   const { userId, masterEncryptionKey, syncTOTP, autofillTOTPEnabled } =
  //     useDeviceStateStore.getState()
  //   expect(userId).toBe('123')
  //   expect(masterEncryptionKey).toBe('abc')
  //   expect(syncTOTP).toBeTruthy()
  //   expect(autofillTOTPEnabled).toBeTruthy()
  // })
})
