import { Field, ObjectType, GraphQLISODateTime, Int } from 'type-graphql'
import { EncryptedSecretGQL } from './EncryptedSecretGQL'
import { UserGQL } from './UserGQL'
import { DeviceGQL } from './DeviceGQL'
import { WebInputGQL } from './WebInputGQL'
import * as GraphQLScalars from 'graphql-scalars'

@ObjectType()
export class SecretUsageEventGQLScalars {
  @Field(() => GraphQLScalars.BigIntResolver)
  id: number

  @Field(() => String)
  kind: string

  @Field(() => GraphQLISODateTime)
  timestamp: Date

  @Field(() => String)
  secretId: string

  @Field(() => String, { nullable: true })
  url: string | null

  @Field(() => String)
  userId: string

  @Field(() => String)
  deviceId: string

  @Field(() => Int, { nullable: true })
  webInputId: number | null
}

@ObjectType()
export class SecretUsageEventGQL extends SecretUsageEventGQLScalars {
  @Field(() => EncryptedSecretGQL)
  Secret: EncryptedSecretGQL

  @Field(() => UserGQL)
  User: UserGQL

  @Field(() => DeviceGQL)
  Device: DeviceGQL

  @Field(() => WebInputGQL, { nullable: true })
  WebOTPInput: WebInputGQL | null

  // skip overwrite 👇
}
