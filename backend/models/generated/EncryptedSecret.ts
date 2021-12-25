import { Field, ID, ObjectType, Int } from 'type-graphql'
import { EncryptedSecretTypeGQL } from '../types/EncryptedSecretType'
import { SecretUsageEventGQL } from './SecretUsageEvent'
import { UserGQL } from './User'

@ObjectType()
export class EncryptedSecretGQLScalars {
  @Field(() => ID)
  id: number

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
  url?: string

  @Field({ nullable: true })
  androidUri?: string

  @Field({ nullable: true })
  iosUri?: string

  @Field({ nullable: true })
  iconUrl?: string

  @Field()
  label: string

  @Field()
  userId: string
}

@ObjectType()
export class EncryptedSecretGQL extends EncryptedSecretGQLScalars {
  @Field(() => EncryptedSecretTypeGQL)
  kind: EncryptedSecretTypeGQL

  @Field(() => UserGQL)
  user: UserGQL

  @Field(() => [SecretUsageEventGQL])
  SecretUsageEvent: SecretUsageEventGQL[]

  // skip overwrite 👇
}
