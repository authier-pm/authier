import { Field, ObjectType, ID, Int } from 'type-graphql'
import { EncryptedSecretTypeGQL } from '../types/EncryptedSecretType'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'

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

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field({ nullable: true })
  deletedAt?: Date

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
