import { Field, ID, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'
import { DeviceGQL } from './Device'
import { WebInputGQL } from './WebInput'
import { EncryptedSecretGQL } from './EncryptedSecret'

@ObjectType()
export class SecretUsageEventGQLScalars {
  @Field(() => ID)
  id: number

  @Field()
  kind: string

  @Field()
  timestamp: Date

  @Field()
  url: string

  @Field()
  userId: string

  @Field()
  deviceId: string

  @Field(() => Int, { nullable: true })
  webInputId?: number
}

@ObjectType()
export class SecretUsageEventGQL extends SecretUsageEventGQLScalars {
  @Field(() => UserGQL)
  User: UserGQL

  @Field(() => DeviceGQL)
  Device: DeviceGQL

  @Field(() => WebInputGQL, { nullable: true })
  WebOTPInput?: WebInputGQL

  @Field(() => [EncryptedSecretGQL])
  EncryptedSecret: EncryptedSecretGQL[]

  // skip overwrite 👇
}
