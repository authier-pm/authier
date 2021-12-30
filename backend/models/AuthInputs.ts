import { GraphQLEmailAddress } from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'

@InputType()
export class RegisterNewDeviceInput {
  @Field(() => GraphQLEmailAddress)
  email: string
  @Field()
  deviceName: string
  @Field()
  deviceId: string
  @Field()
  firebaseToken: string
  @Field()
  addDeviceSecret: string
  @Field()
  addDeviceSecretEncrypted: string
}
