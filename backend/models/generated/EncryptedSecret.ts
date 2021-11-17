import { Field, ID, ObjectType, Int } from 'type-graphql'
import { EncryptedSecretTypeGQL } from '../types/EncryptedSecretType'
import { SecretUsageEventGQL } from './SecretUsageEvent'
import { UserGQL } from './User'

@ObjectType()
export class EncryptedSecretGQL {
  @Field(() => ID)
  id: number

  @Field()
  encrypted: string

  @Field(() => Int)
  version: number

  @Field()
  userId: string

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
  lastUsageEventId?: number

  @Field(() => SecretUsageEventGQL, { nullable: true })
  lastUsageEvent?: SecretUsageEventGQL

  @Field({ nullable: true })
  iconUrl?: string

  @Field()
  label: string

  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
