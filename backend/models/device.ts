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
import { LoginResponse } from './models'

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
