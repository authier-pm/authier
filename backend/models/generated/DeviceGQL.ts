import { Field, ObjectType, ID, GraphQLISODateTime, Int } from 'type-graphql'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import { DecryptionChallengeGQL } from './DecryptionChallengeGQL'

@ObjectType()
export class DeviceGQLScalars {
  @Field(() => ID)
  id: string

  @Field()
  firstIpAddress: string

  @Field()
  lastIpAddress: string

  @Field()
  firebaseToken: string

  @Field()
  name: string

  @Field()
  platform: string

  @Field()
  ipAddressLock: boolean

  @Field(() => GraphQLISODateTime, { nullable: true })
  logoutAt: Date | null

  @Field()
  syncTOTP: boolean

  @Field(() => Int, { nullable: true })
  vaultLockTimeoutSeconds: number | null

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  deletedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  registeredWithMasterAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastSyncAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastUnlockAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastLockAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  masterPasswordOutdatedAt: Date | null

  @Field()
  userId: string
}

@ObjectType()
export class DeviceGQL extends DeviceGQLScalars {
  @Field(() => UserGQL)
  User: UserGQL

  @Field(() => UserGQL, { nullable: true })
  UserMaster: UserGQL | null

  @Field(() => [SecretUsageEventGQL])
  SecretUsageEvents: SecretUsageEventGQL[]

  @Field(() => [DecryptionChallengeGQL])
  DeviceDecryptionChallengesApproved: DecryptionChallengeGQL[]

  // skip overwrite 👇
}
