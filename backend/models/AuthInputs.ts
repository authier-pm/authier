import type { MasterDeviceResetConfig } from '../../shared/masterDeviceResetConfig'
import { Field, ID, InputType } from 'type-graphql'
import { EncryptedSecretPatchInput } from './models'
import {
  GraphQLJSON,
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt
} from 'graphql-scalars'

@InputType()
export class AddNewDeviceInput {
  @Field(() => String, {
    nullable: true,
    description: 'Firebase token is only used for mobile app'
  })
  firebaseToken: string | null

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string

  @Field(() => GraphQLNonEmptyString)
  encryptionSalt: string

  @Field(() => String)
  devicePlatform: string
}

@InputType()
export class RegisterNewAccountInput extends AddNewDeviceInput {
  @Field(() => GraphQLJSON, { nullable: true })
  masterDeviceResetConfig?: MasterDeviceResetConfig

  @Field(() => ID)
  deviceId: string

  @Field(() => String)
  deviceName: string

  @Field(() => GraphQLEmailAddress)
  email: string
}

@InputType()
export class ChangeMasterPasswordInput {
  @Field(() => [EncryptedSecretPatchInput])
  secrets: EncryptedSecretPatchInput[]

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string
  @Field(() => GraphQLPositiveInt)
  decryptionChallengeId: number
}
