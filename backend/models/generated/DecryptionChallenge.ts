import { Field, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'
import { DeviceGQL } from './Device'

@ObjectType()
export class DecryptionChallengeGQLScalars {
  @Field(() => Int)
  id: number

  @Field()
  ipAddress: string

  @Field({ nullable: true })
  approvedAt?: Date

  @Field({ nullable: true })
  rejectedAt?: Date

  @Field({ nullable: true })
  blockIp?: boolean

  @Field()
  deviceName: string

  @Field()
  deviceId: string

  @Field()
  userId: string

  @Field()
  createdAt: Date

  @Field()
  approvedByRecovery: boolean

  @Field({ nullable: true })
  approvedFromDeviceId?: string
}

@ObjectType()
export class DecryptionChallengeGQL extends DecryptionChallengeGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  @Field(() => DeviceGQL, { nullable: true })
  approvedFromDevice?: DeviceGQL

  @Field(() => [UserGQL])
  User: UserGQL[]

  // skip overwrite 👇
}
