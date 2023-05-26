import 'react-native-gesture-handler/jestSetup'
jest.useFakeTimers()
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest
      .fn()
      .mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset)
  }
})

jest.mock('@apollo/client', () => {
  const actualApolloClient = jest.requireActual('@apollo/client')

  return {
    ...actualApolloClient,
    ApolloClient: jest.fn().mockImplementation(() => ({
      mutate: jest.fn().mockImplementation((options) => {
        return Promise.resolve({
          data: {
            currentDevice: {
              markAsSynced: 'test_synced_string'
            }
          }
        })
      })
    })),
    InMemoryCache: jest.fn(),
    from: jest.fn(),
    HttpLink: jest.fn(),
    ApolloLink: jest.fn()
  }
})

jest.mock('react-native-vector-icons/Ionicons', () => 'MockedIcon')

// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}

  return Reanimated
})

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn()
    }),
    useRoute: () => ({
      params: {
        id: '123'
      }
    })
  }
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

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
