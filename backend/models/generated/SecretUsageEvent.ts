import { Field, ObjectType, ID, Int } from 'type-graphql'
import { EncryptedSecretGQL } from './EncryptedSecret'
import { UserGQL } from './User'
import { DeviceGQL } from './Device'
import { WebInputGQL } from './WebInput'

@ObjectType()
export class SecretUsageEventGQLScalars {
  @Field(() => ID)
  id: number

  @Field()
  kind: string

  @Field()
  timestamp: Date

  @Field()
  secretId: string

  @Field({ nullable: true })
  url?: string

  @Field()
  userId: string

  @Field()
  deviceId: string

  @Field(() => Int, { nullable: true })
  webInputId?: number
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
  WebOTPInput?: WebInputGQL

  // skip overwrite 👇
}
