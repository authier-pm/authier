import { Field, ObjectType, ID, Int, GraphQLISODateTime } from 'type-graphql'
import { TokenGQL } from './TokenGQL'
import { DeviceGQL } from './DeviceGQL'
import { DecryptionChallengeGQL } from './DecryptionChallengeGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import { EncryptedSecretGQL } from './EncryptedSecretGQL'
import { WebInputGQL } from './WebInputGQL'
import { TagGQL } from './TagGQL'
import { UserPaidProductsGQL } from './UserPaidProductsGQL'
import { MasterDeviceChangeGQL } from './MasterDeviceChangeGQL'
import { DefaultDeviceSettingsGQL } from './DefaultDeviceSettingsGQL'

@ObjectType()
export class UserGQLScalars {
  @Field(() => ID)
  id: string

  @Field(() => String, { nullable: true })
  email: string | null

  @Field(() => Int)
  tokenVersion: number

  @Field(() => String, { nullable: true })
  username: string | null

  @Field()
  addDeviceSecretEncrypted: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => String, { nullable: true })
  masterDeviceId: string | null

  @Field()
  uiLanguage: string

  @Field(() => Int)
  TOTPlimit: number

  @Field(() => Int)
  loginCredentialsLimit: number

  @Field(() => Int)
  deviceRecoveryCooldownMinutes: number

  @Field()
  notificationOnVaultUnlock: boolean

  @Field(() => Int)
  notificationOnWrongPasswordAttempts: number
}

@ObjectType()
export class UserGQL extends UserGQLScalars {
  @Field(() => [TokenGQL])
  Token: TokenGQL[]

  @Field(() => DeviceGQL, { nullable: true })
  masterDevice: DeviceGQL | null

  @Field(() => DecryptionChallengeGQL, { nullable: true })
  recoveryDecryptionChallenge: DecryptionChallengeGQL | null

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  @Field(() => [EncryptedSecretGQL])
  EncryptedSecrets: EncryptedSecretGQL[]

  @Field(() => [DeviceGQL])
  Devices: DeviceGQL[]

  @Field(() => [WebInputGQL])
  WebInputsAdded: WebInputGQL[]

  @Field(() => [TagGQL])
  Tags: TagGQL[]

  @Field(() => [UserPaidProductsGQL])
  UserPaidProducts: UserPaidProductsGQL[]

  @Field(() => [DecryptionChallengeGQL])
  DecryptionChallenges: DecryptionChallengeGQL[]

  @Field(() => [MasterDeviceChangeGQL])
  MasterDeviceChange: MasterDeviceChangeGQL[]

  @Field(() => DefaultDeviceSettingsGQL, { nullable: true })
  DefaultDeviceSettings: DefaultDeviceSettingsGQL | null

  // skip overwrite 👇
}
