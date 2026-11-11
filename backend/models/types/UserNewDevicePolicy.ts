import { registerEnumType } from 'type-graphql'

export enum UserNewDevicePolicyGQL {
  EMAIL = 'EMAIL',
  OTHER_DEVICE = 'OTHER_DEVICE',
  EMAIL_OR_OTHER_DEVICE = 'EMAIL_OR_OTHER_DEVICE',
  EMAIL_AND_OTHER_DEVICE = 'EMAIL_AND_OTHER_DEVICE'
}
registerEnumType(UserNewDevicePolicyGQL, {
  name: 'UserNewDevicePolicy'
})
