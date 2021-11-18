import { Field, ID, ObjectType } from 'type-graphql'
import { UserGQL } from './User'
import { DeviceGQL } from './Device'

@ObjectType()
export class DecryptionChallengeGQL {
  @Field(() => ID)
  id: number

  @Field({ nullable: true })
  masterPasswordVerifiedAt?: Date

  @Field({ nullable: true })
  approvedAt?: Date

  @Field()
  userId: string

  @Field(() => UserGQL)
  user: UserGQL

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  deviceId?: string

  @Field(() => DeviceGQL, { nullable: true })
  device?: DeviceGQL

  @Field({ nullable: true })
  approvedFromDeviceId?: string

  @Field(() => DeviceGQL, { nullable: true })
  approvedFromDevice?: DeviceGQL

  // skip overwrite 👇

  @Field()
  addDeviceSecretEncrypted: string
}
