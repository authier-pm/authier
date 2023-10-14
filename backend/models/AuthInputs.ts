import { Field, ID, InputType } from 'type-graphql'
import { EncryptedSecretPatchInput } from './models'
import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt
} from 'graphql-scalars'

@InputType()
export class AddNewDeviceInput {
  @Field()
  firebaseToken: string

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string

  @Field(() => GraphQLNonEmptyString)
  encryptionSalt: string

  @Field()
  devicePlatform: string
}

@InputType()
export class RegisterNewAccountInput extends AddNewDeviceInput {
  @Field(() => ID)
  deviceId: string

  @Field()
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
