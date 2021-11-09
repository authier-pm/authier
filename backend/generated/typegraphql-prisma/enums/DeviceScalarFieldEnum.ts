import * as TypeGraphQL from 'type-graphql'

export enum DeviceScalarFieldEnum {
  id = 'id',
  firstIpAddress = 'firstIpAddress',
  lastIpAddress = 'lastIpAddress',
  firebaseToken = 'firebaseToken',
  name = 'name',
  syncTOTP = 'syncTOTP',
  ipAddressLock = 'ipAddressLock',
  vaultLockTimeoutSeconds = 'vaultLockTimeoutSeconds',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  registeredWithMasterAt = 'registeredWithMasterAt',
  lastSyncAt = 'lastSyncAt',
  masterPasswordOutdatedAt = 'masterPasswordOutdatedAt',
  userId = 'userId'
}
TypeGraphQL.registerEnumType(DeviceScalarFieldEnum, {
  name: 'DeviceScalarFieldEnum',
  description: undefined
})
