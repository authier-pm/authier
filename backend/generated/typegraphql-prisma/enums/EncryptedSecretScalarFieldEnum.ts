import * as TypeGraphQL from 'type-graphql'

export enum EncryptedSecretScalarFieldEnum {
  id = 'id',
  encrypted = 'encrypted',
  version = 'version',
  userId = 'userId',
  kind = 'kind',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  url = 'url',
  lastUsageEventId = 'lastUsageEventId',
  iconUrl = 'iconUrl',
  label = 'label'
}
TypeGraphQL.registerEnumType(EncryptedSecretScalarFieldEnum, {
  name: 'EncryptedSecretScalarFieldEnum',
  description: undefined
})
