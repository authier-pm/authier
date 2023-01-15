import { registerEnumType } from 'type-graphql'

export enum TokenTypeGQL {
  EMAIL = 'EMAIL',
  API = 'API'
}
registerEnumType(TokenTypeGQL, {
  name: 'TokenType'
})
