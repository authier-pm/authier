import { Field, ObjectType, ID, Int } from 'type-graphql'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'
import { DecryptionChallengeGQL } from './DecryptionChallenge'

import { DevicePlatformGQL } from '../types/DevicePlatform'

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

  @Field(() => DevicePlatformGQL)
  platform: DevicePlatformGQL

  @Field()
  syncTOTP: boolean

  @Field()
  ipAddressLock: boolean

  @Field(() => Int, { nullable: true })
  vaultLockTimeoutSeconds?: number

  @Field({ nullable: true })
  logoutAt?: Date

  @Field({ nullable: true })
  deauthorizedFromDeviceId?: string

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field({ nullable: true })
  registeredWithMasterAt?: Date

  @Field({ nullable: true })
  lastSyncAt?: Date

  @Field({ nullable: true })
  masterPasswordOutdatedAt?: Date

  @Field()
  userId: string
}

@ObjectType()
export class DeviceGQL extends DeviceGQLScalars {
  @Field(() => DevicePlatformGQL)
  platform: DevicePlatformGQL

  @Field(() => UserGQL)
  User: UserGQL

  @Field(() => UserGQL, { nullable: true })
  UserMaster?: UserGQL

  @Field(() => [SecretUsageEventGQL])
  SecretUsageEvents: SecretUsageEventGQL[]

  @Field(() => [DecryptionChallengeGQL])
  DeviceDecryptionChallengesApproved: DecryptionChallengeGQL[]

  // skip overwrite 👇
}
