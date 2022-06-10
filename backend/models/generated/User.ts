import { Field, ObjectType, ID, Int } from 'type-graphql'
import { TokenGQL } from './Token'
import { DeviceGQL } from './Device'
import { SecretUsageEventGQL } from './SecretUsageEvent'
import { EncryptedSecretGQL } from './EncryptedSecret'
import { WebInputGQL } from './WebInput'
import { SettingsConfigGQL } from './SettingsConfig'
import { TagGQL } from './Tag'
import { UserPaidProductsGQL } from './UserPaidProducts'
import { DecryptionChallengeGQL } from './DecryptionChallenge'

@ObjectType()
export class UserGQLScalars {
  @Field(() => ID)
  id: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  stripeId?: string

  @Field()
  accountType: string

  @Field(() => Int)
  tokenVersion: number

  @Field({ nullable: true })
  username?: string

  @Field()
  addDeviceSecretEncrypted: string

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field({ nullable: true })
  masterDeviceId?: string

  @Field(() => Int)
  TOTPlimit: number

  @Field(() => Int)
  loginCredentialsLimit: number

  @Field(() => Int)
  deviceRecoveryCooldownMinutes: number
}

@ObjectType()
export class UserGQL extends UserGQLScalars {
  @Field(() => [TokenGQL])
  Token: TokenGQL[]

  @Field(() => DeviceGQL, { nullable: true })
  masterDevice?: DeviceGQL

  @Field(() => DecryptionChallengeGQL, { nullable: true })
  recoveryDecryptionChallenge?: DecryptionChallengeGQL

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  @Field(() => [EncryptedSecretGQL])
  EncryptedSecrets: EncryptedSecretGQL[]

  @Field(() => [DeviceGQL])
  Devices: DeviceGQL[]

  @Field(() => [WebInputGQL])
  WebInputsAdded: WebInputGQL[]

  @Field(() => [SettingsConfigGQL])
  SettingsConfigs: SettingsConfigGQL[]

  @Field(() => [TagGQL])
  Tags: TagGQL[]

  @Field(() => [UserPaidProductsGQL])
  UserPaidProducts: UserPaidProductsGQL[]

  @Field(() => [DecryptionChallengeGQL])
  DecryptionChallenges: DecryptionChallengeGQL[]

  // skip overwrite 👇
}
