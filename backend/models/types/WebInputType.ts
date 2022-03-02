import { registerEnumType } from 'type-graphql'

export enum WebInputTypeGQL {
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL',
  PASSWORD = 'PASSWORD',
  NEW_PASSWORD = 'NEW_PASSWORD',
  NEW_PASSWORD_CONFIRMATION = 'NEW_PASSWORD_CONFIRMATION'
}
registerEnumType(WebInputTypeGQL, {
  name: 'WebInputType'
})
