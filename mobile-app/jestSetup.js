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

jest.mock('react-native-vector-icons/Ionicons', () => 'MockedIcon')

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('myMockToken'))
  })
})

jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: () => {},
      createAnimatedComponent: (component) => component,
      addWhitelistedNativeProps: () => {},
      addWhitelistedUIProps: () => {}
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((_, value) => value),
    withSequence: jest.fn((...values) => values[0]),
    withRepeat: jest.fn((value) => value),
    cancelAnimation: jest.fn(),
    useAnimatedGestureHandler: jest.fn(),
    createAnimatedComponent: (component) => component,
    FadeIn: { duration: jest.fn(() => ({ delay: jest.fn() })) },
    FadeOut: { duration: jest.fn(() => ({ delay: jest.fn() })) },
    Layout: { springify: jest.fn() }
  }
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

// jest.mock('apollo-link-retry', () => {
//   return { RetryLink: jest.fn() }
// })
// jest.mock('apollo-link-serialize', () => {
//   return jest.fn()
// })
// jest.mock('apollo-link-queue', () => {
//   return jest.fn()
// })
// jest.mock('@apollo/client/link/context', () => {
//   return {
//     setContext: jest.fn().mockRejectedValue({
//       headers: {
//         authorization: 'test'
//       }
//     })
//   }
// })

// jest.mock('@react-native-firebase/messaging', () => {
//   return {
//     __esModule: true,
//     default: () => ({
//       getToken: jest.fn(() => Promise.resolve('test_token'))
//     })
//   }
// })

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
    getItem: jest.fn().mockResolvedValue(null),
    deleteItem: jest.fn()
  }
})

jest.mock('react-native-device-info', () => {
  return {
    getUniqueId: jest.fn(() => Promise.resolve('test_device_id')),
    getDeviceName: jest.fn(() => Promise.resolve('test_device_name'))
  }
})

jest.mock('native-base', () => ({
  Toast: {
    show: jest.fn()
  }
}))
