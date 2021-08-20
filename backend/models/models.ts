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
import { EncryptedSecrets } from '../generated/typegraphql-prisma'

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
export class LoginResponse {
  @Field(() => String)
  accessToken: string

  @Field(() => EncryptedSecrets, { nullable: true })
  secrets: EncryptedSecrets
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
