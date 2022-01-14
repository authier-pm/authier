import { Field, ObjectType, ID } from 'type-graphql'
import { UserGQL } from './User'
import { EmailVerificationTypeGQL } from '../types/EmailVerificationType'

@ObjectType()
export class EmailVerificationGQLScalars {
  @Field(() => ID)
  address: string

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  verifiedAt?: Date

  @Field()
  userId: string

  @Field(() => EmailVerificationTypeGQL)
  kind: EmailVerificationTypeGQL
}

@ObjectType()
export class EmailVerificationGQL extends EmailVerificationGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  @Field(() => EmailVerificationTypeGQL)
  kind: EmailVerificationTypeGQL

  // skip overwrite 👇
}
