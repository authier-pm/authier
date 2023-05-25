// import { NativeModules as RNNativeModules } from 'react-native'
// RNNativeModules.UIManager = RNNativeModules.UIManager || {}
// RNNativeModules.UIManager.RCTView = RNNativeModules.UIManager.RCTView || {}
// RNNativeModules.RNGestureHandlerModule =
//   RNNativeModules.RNGestureHandlerModule || {
//     State: { BEGAN: 'BEGAN', FAILED: 'FAILED', ACTIVE: 'ACTIVE', END: 'END' },
//     attachGestureHandler: jest.fn(),
//     createGestureHandler: jest.fn(),
//     dropGestureHandler: jest.fn(),
//     updateGestureHandler: jest.fn()
//   }
// RNNativeModules.PlatformConstants = RNNativeModules.PlatformConstants || {
//   forceTouchAvailable: false
// }
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
jest.useFakeTimers()
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock the ApolloClient
jest.mock('@apollo/client', () => {
  const actualApolloClient = jest.requireActual('@apollo/client')
  return {
    ...actualApolloClient,
    apolloClient: {
      mutate: jest.fn()
    },
    InMemoryCache: jest.fn(),
    from: jest.fn(),
    HttpLink: jest.fn(),
    ApolloLink: jest.fn(),
    useApolloClient: () => ({
      mutate: jest.fn(() => ({
        data: {
          me: {
            addEncryptedSecrets: [
              // Return whatever your server would return here
            ]
          }
        }
      }))
    })
  }
})

// Mock crypto.subtle methods
const subtleMock = {
  getRandomValues: jest.fn().mockReturnValue(new Uint8Array(12)),

  subtle: {
    exportKey: jest.fn(),
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    decrypt: jest.fn(),
    encrypt: jest.fn()
  }
}

// Mock global crypto object
global.crypto = {
  subtle: subtleMock.subtle
}
global.self = {
  crypto: subtleMock
}

jest.mock('apollo-link-retry', () => {
  return { RetryLink: jest.fn() }
})
jest.mock('apollo-link-serialize', () => {
  return jest.fn()
})
jest.mock('apollo-link-queue', () => {
  return jest.fn()
})
jest.mock('@apollo/client/link/context', () => {
  return { setContext: jest.fn() }
})

jest.mock('@react-native-firebase/messaging', () => {
  return {
    __esModule: true,
    default: () => ({
      getToken: jest.fn(() => Promise.resolve('test_token'))
    })
  }
})

jest.mock('react-native-url-polyfill', () => ({
  URL: jest.fn().mockImplementation((url) => ({ toString: () => url }))
}))

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn()
}))

jest.mock('jwt-decode', () => jest.fn())
jest.mock('react-native-sensitive-info', () => {
  return {
    isSensorAvailable: jest.fn(),
    setItem: jest.fn().mockResolvedValue(true),
    getItem: jest.fn().mockResolvedValue(null)
  }
})

jest.mock('react-native-device-info', () => {
  return {
    getUniqueId: jest.fn(() => Promise.resolve('test_device_id')),
    getDeviceName: jest.fn(() => Promise.resolve('test_device_name'))
  }
})

jest.mock('./src/utils/secretStorage', () => ({
  getSensitiveItem: jest.fn(),
  setSensitiveItem: jest.fn()
}))

jest.mock('native-base', () => ({
  Toast: {
    show: jest.fn()
  }
}))
