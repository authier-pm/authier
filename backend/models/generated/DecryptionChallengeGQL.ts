import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'
import { DeviceGQL } from './DeviceGQL'

@ObjectType()
export class DecryptionChallengeGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => String)
  ipAddress: string

  @Field(() => GraphQLISODateTime, { nullable: true })
  approvedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  rejectedAt: Date | null

  @Field(() => Boolean, { nullable: true })
  blockIp: boolean | null

  @Field(() => String)
  deviceName: string

  @Field(() => String)
  deviceId: string

  @Field(() => String)
  userId: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => Boolean)
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
