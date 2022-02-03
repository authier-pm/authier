import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'
import { EncryptedSecretInput, EncryptedSecretPatchInput } from './models'

@InputType()
export class AddNewDeviceInput {
  @Field()
  firebaseToken: string

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string

  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string
}

@InputType()
export class RegisterNewAccountInput extends AddNewDeviceInput {
  @Field(() => GraphQLUUID)
  deviceId: string

  @Field()
  deviceName: string

  @Field(() => GraphQLNonEmptyString)
  encryptionSalt: string

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
