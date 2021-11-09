import * as TypeGraphQL from 'type-graphql'

export enum SecretUsageEventScalarFieldEnum {
  id = 'id',
  kind = 'kind',
  timestamp = 'timestamp',
  ipAddress = 'ipAddress',
  url = 'url',
  userId = 'userId',
  deviceId = 'deviceId',
  webInputId = 'webInputId'
}
TypeGraphQL.registerEnumType(SecretUsageEventScalarFieldEnum, {
  name: 'SecretUsageEventScalarFieldEnum',
  description: undefined
})
