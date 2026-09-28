import { Field, GraphQLISODateTime, ID, ObjectType } from 'type-graphql'

/** Ciphertext only: browsers decrypt it with the vault key. */
@ObjectType()
export class RelayedVerificationCodeGQL {
  @Field(() => ID)
  id: string

  @Field(() => String)
  encrypted: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime)
  expiresAt: Date

  @Field(() => String, { description: 'Name of the phone that relayed it' })
  deviceName: string
}
