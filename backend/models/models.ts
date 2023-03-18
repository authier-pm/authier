import { Field, InputType, Int, ObjectType } from 'type-graphql'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { GraphQLUUID } from 'graphql-scalars'
import { UserMutation } from './UserMutation'

@ObjectType()
export class DecryptionChallengeResponse {
  @Field()
  userId: string

  @Field()
  addDeviceSecretEncrypted: string
}

@ObjectType()
export class UserBase {
  @Field(() => GraphQLUUID)
  id: string

  @Field(() => String, { nullable: true })
  email?: string

  @Field(() => String)
  phone_number?: string

  @Field(() => String)
  account_name?: string

  @Field(() => String)
  password: string

  @Field(() => Number)
  tokenVersion: number

  @Field(() => Int)
  primaryDeviceId: number
}

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken: string

  @Field(() => UserMutation)
  user: UserMutation

  @Field(() => String, { nullable: false })
  encryptionSalt: string
}

@InputType()
export class OTPEvent {
  @Field(() => EncryptedSecretTypeGQL)
  kind: EncryptedSecretTypeGQL

  @Field(() => String)
  url: string
}

@InputType()
export class EncryptedSecretInput {
  @Field(() => EncryptedSecretTypeGQL, { nullable: false })
  kind: EncryptedSecretTypeGQL

  @Field(() => String, { nullable: false })
  encrypted: string
}

@InputType()
export class SettingsInput {
  @Field(() => Boolean)
  syncTOTP: boolean

  @Field(() => Int)
  vaultLockTimeoutSeconds: number

  @Field(() => Boolean)
  autofillCredentialsEnabled: boolean

  @Field(() => Boolean)
  autofillTOTPEnabled: boolean

  @Field(() => String)
  uiLanguage: string
}

@InputType()
export class EncryptedSecretPatchInput extends EncryptedSecretInput {
  @Field(() => GraphQLUUID)
  id: string
}
