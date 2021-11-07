import * as TypeGraphQL from 'type-graphql'

export enum DeviceScalarFieldEnum {
  id = 'id',
  firstIpAddress = 'firstIpAddress',
  lastIpAddress = 'lastIpAddress',
  firebaseToken = 'firebaseToken',
  name = 'name',
  syncTOTP = 'syncTOTP',
  vaultLockTimeoutSeconds = 'vaultLockTimeoutSeconds',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  registeredWithMasterAt = 'registeredWithMasterAt',
  lastSyncAt = 'lastSyncAt',
  userId = 'userId'
}
TypeGraphQL.registerEnumType(DeviceScalarFieldEnum, {
  name: 'DeviceScalarFieldEnum',
  description: undefined
})
