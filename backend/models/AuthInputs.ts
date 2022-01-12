import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'
import { EncryptedSecretInput, EncryptedSecretPatchInput } from './models'

@InputType()
export class RegisterDeviceInput {
  @Field(() => GraphQLEmailAddress)
  email: string
  @Field()
  deviceName: string
  @Field(() => GraphQLUUID)
  deviceId: string
  @Field()
  firebaseToken: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string
  @Field(() => GraphQLNonEmptyString, { nullable: true })
  encryptionSalt: string
  @Field(() => GraphQLPositiveInt, { nullable: true })
  decryptionChallengeId: number
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
