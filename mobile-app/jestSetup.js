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
jest.mock('zustand')
