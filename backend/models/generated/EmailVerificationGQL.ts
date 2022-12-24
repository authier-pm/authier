import { Field, ObjectType, ID, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'
import { EmailVerificationTypeGQL } from '../types/EmailVerificationType'

@ObjectType()
export class EmailVerificationGQLScalars {
  @Field(() => ID)
  address: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  verifiedAt: Date | null

  @Field()
  userId: string

  @Field(() => EmailVerificationTypeGQL)
  kind: EmailVerificationTypeGQL
}

@ObjectType()
export class EmailVerificationGQL extends EmailVerificationGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
