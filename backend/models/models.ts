import { prismaClient } from '../prismaClient'
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  ObjectType,
  UseMiddleware
} from 'type-graphql'
import { UserGQL } from './generated/User'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'

@ObjectType()
export class DecryptionChallengeResponse {
  @Field()
  userId: string

  @Field()
  addDeviceSecretEncrypted: string
}

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
export class UserAfterAuth extends UserGQL {}

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken: string

  @Field(() => UserAfterAuth)
  user: UserAfterAuth
}

@InputType()
export class OTPEvent {
  @Field(() => EncryptedSecretTypeGQL)
  kind: EncryptedSecretTypeGQL

  @Field(() => String)
  url: string
}

@InputType()
export class EncryptedSecretInput {
  @Field(() => EncryptedSecretTypeGQL)
  kind: EncryptedSecretTypeGQL

  @Field(() => String, { nullable: true })
  url: string

  @Field(() => String, { nullable: true })
  iosUri: string

  @Field(() => String, { nullable: true })
  androidUri: string

  @Field(() => String)
  label: string
  @Field(() => String)
  encrypted: string
}
