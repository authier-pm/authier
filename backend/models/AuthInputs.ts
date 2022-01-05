import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'

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
  @Field(() => GraphQLPositiveInt)
  decryptionChallengeId: number
}
