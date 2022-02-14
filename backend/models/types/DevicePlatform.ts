import { registerEnumType } from 'type-graphql'

export enum DevicePlatformGQL {
  WINDOWS = 'WINDOWS',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  MAC = 'MAC',
  LINUX = 'LINUX'
}
registerEnumType(DevicePlatformGQL, {
  name: 'DevicePlatform'
})
