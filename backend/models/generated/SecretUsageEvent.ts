import { Field, ID, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'
import { DeviceGQL } from './Device'
import { WebInputGQL } from './WebInput'
import { EncryptedSecretGQL } from './EncryptedSecret'

@ObjectType()
export class SecretUsageEventGQL {
  @Field(() => ID)
  id: number

  @Field()
  kind: string

  @Field()
  timestamp: Date

  @Field()
  url: string

  @Field(() => UserGQL)
  User: UserGQL

  @Field()
  userId: string

  @Field(() => DeviceGQL)
  Device: DeviceGQL

  @Field()
  deviceId: string

  @Field(() => Int, { nullable: true })
  webInputId?: number

  @Field(() => WebInputGQL, { nullable: true })
  WebOTPInput?: WebInputGQL

  @Field(() => [EncryptedSecretGQL])
  EncryptedSecret: EncryptedSecretGQL[]

  // skip overwrite 👇
}
