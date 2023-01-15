import { registerEnumType } from 'type-graphql'

export enum EncryptedSecretTypeGQL {
  TOTP = 'TOTP',
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS'
}
registerEnumType(EncryptedSecretTypeGQL, {
  name: 'EncryptedSecretType'
})
