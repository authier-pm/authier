import { registerEnumType } from 'type-graphql'

export enum EmailVerificationTypeGQL {
  PRIMARY = 'PRIMARY',
  CONTACT = 'CONTACT'
}
registerEnumType(EmailVerificationTypeGQL, {
  name: 'EmailVerificationType'
})
