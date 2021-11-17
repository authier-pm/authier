import { Field, ID, ObjectType, Int } from 'type-graphql'
import { VaultUnlockEventsGQL } from './VaultUnlockEvents'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'

@ObjectType()
export class DeviceGQL {
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
  syncTOTP: boolean

  @Field()
  ipAddressLock: boolean

  @Field(() => Int, { nullable: true })
  vaultLockTimeoutSeconds?: number

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

  @Field(() => [VaultUnlockEventsGQL])
  VaultUnlockEvents: VaultUnlockEventsGQL[]

  @Field(() => [VaultUnlockEventsGQL])
  VaultUnlockEventsApproved: VaultUnlockEventsGQL[]

  @Field()
  userId: string

  @Field(() => UserGQL)
  User: UserGQL

  @Field(() => UserGQL, { nullable: true })
  UserMaster?: UserGQL

  @Field(() => [SecretUsageEventGQL])
  SecretUsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
