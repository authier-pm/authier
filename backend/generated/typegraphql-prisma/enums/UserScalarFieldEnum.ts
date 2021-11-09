import * as TypeGraphQL from 'type-graphql'

export enum UserScalarFieldEnum {
  id = 'id',
  email = 'email',
  tokenVersion = 'tokenVersion',
  username = 'username',
  addDeviceSecret = 'addDeviceSecret',
  addDeviceSecretEncrypted = 'addDeviceSecretEncrypted',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  masterDeviceId = 'masterDeviceId',
  TOTPlimit = 'TOTPlimit',
  loginCredentialsLimit = 'loginCredentialsLimit'
}
TypeGraphQL.registerEnumType(UserScalarFieldEnum, {
  name: 'UserScalarFieldEnum',
  description: undefined
})
