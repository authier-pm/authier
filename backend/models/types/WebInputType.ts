import { registerEnumType } from 'type-graphql'

export enum WebInputTypeGQL {
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL',
  PASSWORD = 'PASSWORD'
}
registerEnumType(WebInputTypeGQL, {
  name: 'WebInputType'
})
