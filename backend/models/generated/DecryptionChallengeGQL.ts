import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'
import { DeviceGQL } from './DeviceGQL'

@ObjectType()
export class DecryptionChallengeGQLScalars {
  @Field(() => Int)
  id: number

  @Field()
  ipAddress: string

  @Field(() => GraphQLISODateTime, { nullable: true })
  approvedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  rejectedAt: Date | null

  @Field(() => Boolean, { nullable: true })
  blockIp: boolean | null

  @Field()
  deviceName: string

  @Field()
  deviceId: string

  @Field()
  userId: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field()
  approvedByRecovery: boolean

  @Field(() => String, { nullable: true })
  approvedFromDeviceId: string | null
}

@ObjectType()
export class DecryptionChallengeGQL extends DecryptionChallengeGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  @Field(() => DeviceGQL, { nullable: true })
  approvedFromDevice: DeviceGQL | null

  @Field(() => [UserGQL])
  User: UserGQL[]

  // skip overwrite 👇
}
