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
  @Field(() => GraphQLPositiveInt, { nullable: true })
  decryptionChallengeId: number
}

@InputType()
export class ChangeMasterPasswordInput {
  @Field(() => [EncryptedSecretPatchInput])
  secrets: EncryptedSecretPatchInput[]

  @Field({
    nullable: true,
    description:
      'When true, it will invalidate sessions for all the currently logged in devices and keep only the current device logged in'
  })
  logoutFromAllDevices: boolean
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string
  @Field(() => GraphQLPositiveInt)
  decryptionChallengeId: number
}
