import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLUUID
} from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'

@InputType()
export class RegisterNewDeviceInput {
  @Field(() => GraphQLEmailAddress)
  email: string
  @Field()
  deviceName: string
  @Field(() => GraphQLUUID)
  deviceId: string
  @Field(() => GraphQLUUID)
  firebaseToken: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecret: string
  @Field(() => GraphQLNonEmptyString)
  addDeviceSecretEncrypted: string
}
