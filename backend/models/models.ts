import { Field, InputType, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class User {
  @Field(() => String)
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
}

@ObjectType()
export class EncryptedAuths {
  @Field(() => Int)
  id: number

  @Field(() => String)
  encrypted: string

  @Field(() => Int)
  version: number
}

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken: string

  @Field(() => EncryptedAuths, { nullable: true })
  auths: EncryptedAuths
}

@InputType()
export class OTPEvent {
  @Field(() => String)
  kind: string

  @Field(() => String)
  url: string

  @Field(() => String)
  userId: string
}

@ObjectType()
export class Device {
  @Field(() => String)
  firstIpAdress: string

  @Field(() => String)
  lastIpAdress: string

  @Field(() => String)
  firebaseToken: string

  @Field(() => String)
  name: string
}
