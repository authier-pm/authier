// // import messaging from '@react-native-firebase/messaging'
// // import { getDeviceName, getUniqueId } from 'react-native-device-info'
// // import { device, Device } from '../utils/Device'
// // import { getSensitiveItem } from './secretStorage'
//
// jest.mock('@react-native-firebase/messaging', () => {
//   return {
//     __esModule: true,
//     default: () => ({
//       getToken: jest.fn(() => Promise.resolve('test_token'))
//     })
//   }
// })
//
// jest.mock('react-native-device-info', () => {
//   return {
//     getUniqueId: jest.fn(() => Promise.resolve('test_device_id')),
//     getDeviceName: jest.fn(() => Promise.resolve('test_device_name'))
//   }
// })
//
// jest.mock('../utils/secretStorage.ts', () => {
//   return {
//     getSensitiveItem: jest.fn(() => Promise.resolve(null)),
//     setSensitiveItem: jest.fn(() => Promise.resolve(null))
//   }
// })
//
// jest.mock('react-native-sensitive-info', () => ({
//   setItem: jest.fn().mockResolvedValue(true),
//   getItem: jest.fn().mockResolvedValue(null)
// }))
//
// // jest.mock('@apollo/client/link/error', () => ({
// //   onError: jest.fn()
// // }))
// //
// // jest.mock('@apollo/client', () => ({
// //   ApolloClient: jest.fn(),
// //   InMemoryCache: jest.fn(),
// //   from: jest.fn(),
// //   HttpLink: jest.fn(),
// //   ApolloLink: jest.fn(),
// //   setContext: jest.fn()
// // }))
// //
// // jest.mock('apollo-link-retry', () => ({
// //   RetryLink: jest.fn()
// // }))
// //
// // jest.mock('apollo-link-serialize', () => jest.fn())
// //
// // jest.mock('apollo-link-queue', () => jest.fn())
//
// jest.mock('../utils/tokenFromAsyncStorage', () => ({
//   accessToken: 'dummy_token'
// }))
//
// // jest.mock('../apollo/tokenRefresh.ts', () => jest.fn())
//
describe('Device', () => {
  it.todo('should initialize correctly')
  // let device: Device

  //  beforeEach(() => {
  //    device = new Device()
  //    jest.clearAllMocks()
  //  })

  //  describe('initialize', () => {
  //    it('should initialize correctly', async () => {
  //      await device.initialize()

  //      expect(getUniqueId).toHaveBeenCalledTimes(1)
  //      expect(getDeviceName).toHaveBeenCalledTimes(1)
  //      expect(messaging().getToken).toHaveBeenCalledTimes(1)
  //      expect(getSensitiveItem).toHaveBeenCalledWith('deviceState')
  //      expect(device.isInitialized).toBe(true)
  //      expect(device.id).toBe('test_device_id')
  //      expect(device.name).toBe('test_device_name')
  //      expect(device.fireToken).toBe('test_token')
  //    })
  //  })
})
