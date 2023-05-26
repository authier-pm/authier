import { act } from '@testing-library/react-native'
import { useStore } from './deviceStore'
import { useTestStore } from './deviceStateStore'

describe('Device Store', () => {
  it.todo('Init state')
  // it('should have the initial state', () => {
  //   const store = useStore.getState()
  //   expect(store.fireToken).toBeNull()
  //   expect(store.lockedState).toBeNull()
  //   expect(store.id).toBeNull()
  //   expect(store.name).toBe('')
  //   expect(store.biometricsAvailable).toBeFalsy()
  //   expect(store.isInitialized).toBeFalsy()
  //   expect(store.isLocked).toBeFalsy()
  //   expect(store.isLoggedIn).toBeFalsy()
  // })

  // it('should save state', () => {
  //   act(() => {
  //     useStore.getState().save({
  //       masterEncryptionKey: 'abc',
  //       email: 'test',
  //       theme: 'light',
  //       userId: '123',
  //       secrets: [],
  //       lockTime: 0,
  //       syncTOTP: false,
  //       authSecret: 'test',
  //       deviceName: 'ttest',
  //       uiLanguage: 'en',
  //       lockTimeEnd: 0,
  //       encryptionSalt: 'test',
  //       biometricsEnabled: false,
  //       authSecretEncrypted: 'test',
  //       autofillTOTPEnabled: false,
  //       autofillCredentialsEnabled: false
  //     })
  //   })
  //
  //   const { userId } = useTestStore.getState()
  //   expect(userId).toBe('123')
  // })
})
