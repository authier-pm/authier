import { registerEnumType } from 'type-graphql'

export enum UserNewDevicePolicyGQL {
  ALLOW = 'ALLOW',
  REQUIRE_ANY_DEVICE_APPROVAL = 'REQUIRE_ANY_DEVICE_APPROVAL',
  REQUIRE_MASTER_DEVICE_APPROVAL = 'REQUIRE_MASTER_DEVICE_APPROVAL'
}
registerEnumType(UserNewDevicePolicyGQL, {
  name: 'UserNewDevicePolicy'
})
