import * as TypeGraphQL from 'type-graphql'

export enum EncryptedSecretType {
  TOTP = 'TOTP',
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS'
}
TypeGraphQL.registerEnumType(EncryptedSecretType, {
  name: 'EncryptedSecretType',
  description: undefined
})
