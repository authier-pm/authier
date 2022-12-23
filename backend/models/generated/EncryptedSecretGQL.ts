import { Field, ObjectType, ID, Int, GraphQLISODateTime } from 'type-graphql'
import { EncryptedSecretTypeGQL } from '../types/EncryptedSecretType'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'

@ObjectType()
export class EncryptedSecretGQLScalars {
  @Field(() => ID)
  id: string

  @Field()
  encrypted: string

  @Field(() => Int)
  version: number

  @Field(() => EncryptedSecretTypeGQL)
  kind: EncryptedSecretTypeGQL

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  deletedAt: Date | null

  @Field()
  userId: string
}

@ObjectType()
export class EncryptedSecretGQL extends EncryptedSecretGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  @Field(() => [SecretUsageEventGQL])
  SecretUsageEvent: SecretUsageEventGQL[]

  // skip overwrite 👇
}
