import { registerEnumType } from 'type-graphql'

export enum EncryptedSecretTypeGQL {
  TOTP = 'TOTP',
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  PASSKEY = 'PASSKEY'
}
registerEnumType(EncryptedSecretTypeGQL, {
  name: 'EncryptedSecretType'
})
