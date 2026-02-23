import { Field, ObjectType, ID, GraphQLISODateTime, Int } from 'type-graphql'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import { DecryptionChallengeGQL } from './DecryptionChallengeGQL'

@ObjectType()
export class DeviceGQLScalars {
  @Field(() => ID)
  id: string

  @Field(() => String)
  firstIpAddress: string

  @Field(() => String)
  lastIpAddress: string

  @Field(() => String, { nullable: true })
  firebaseToken: string | null

  @Field(() => String)
  name: string

  @Field(() => String)
  platform: string

  @Field(() => Boolean)
  ipAddressLock: boolean

  @Field(() => GraphQLISODateTime, { nullable: true })
  logoutAt: Date | null

  @Field(() => Boolean)
  syncTOTP: boolean

  @Field(() => Int)
  vaultLockTimeoutSeconds: number

  @Field(() => Boolean)
  autofillCredentialsEnabled: boolean

  @Field(() => Boolean)
  autofillTOTPEnabled: boolean

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

  @Field(() => String)
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
