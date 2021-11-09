import { prisma } from '../prisma'
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  ObjectType,
  UseMiddleware
} from 'type-graphql'

import {
  EncryptedSecret,
  EncryptedSecretType,
  User
} from '../generated/typegraphql-prisma'

@ObjectType()
export class UserBase {
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

  @Field(() => Int)
  primaryDeviceId: number
}

@ObjectType()
export class UserAfterAuth extends User {
  @Field(() => [EncryptedSecret], { nullable: true })
  EncryptedSecrets: Array<EncryptedSecret> | undefined
}

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken: string

  @Field(() => UserAfterAuth)
  user: UserAfterAuth
}

@InputType()
export class OTPEvent {
  @Field(() => EncryptedSecretType)
  kind: EncryptedSecretType

  @Field(() => String)
  url: string
}

@InputType()
export class EncryptedSecretInput {
  @Field(() => EncryptedSecretType)
  kind: EncryptedSecretType

  @Field(() => String)
  url: string

  @Field(() => String)
  label: string
  @Field(() => String)
  encrypted: string
}
