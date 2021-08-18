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
import { IContext } from '../RootResolver'
import { createAccessToken, createRefreshToken } from '../auth'
import { sendRefreshToken } from '../sendRefreshToken'
import { compare, hash } from 'bcrypt'
import { isAuth } from '../isAuth'

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
