import { isAuth } from './isAuth'
import {
  Query,
  //   Mutation,
  //   Authorized,
  //   Arg,
  //   FieldResolver,
  //   Root,
  Resolver,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware
} from 'type-graphql'
import { prisma } from './prisma'
import { hash, compare } from 'bcrypt'
import { FastifyReply, RawRequestDefaultExpression } from 'fastify'

import { LoginResponse, User } from './models/models'
import { createAccessToken, createRefreshToken } from './auth'
import { sendRefreshToken } from './sendRefreshToken'
import { verify } from 'jsonwebtoken'

export interface IContext {
  request: RawRequestDefaultExpression
  reply: FastifyReply
  payload?: { userId: string }
}

export interface Payload {
  userId: string
  iat: number
  exp: number
}

@Resolver()
export class RecipeResolver {
  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() Ctx: IContext) {
    return `your user ud is: ${Ctx.payload?.userId}`
  }

  @Query(() => [User])
  async users() {
    return await prisma.user.findMany()
  }

  // query for info about user
  @Query(() => User, { nullable: true })
  me(@Ctx() context: IContext) {
    const authorization = context.request.headers['authorization']

    if (!authorization) {
      throw new Error('not authenticated')
    }

    try {
      const token = authorization.split(' ')[1]
      const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
      context.payload = payload as Payload
      //@ts-expect-error
      return prisma.user.findUnique({ where: { id: payload.userId } })
    } catch (err) {
      console.log(err)
      return null
    }
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  //For testing purposes
  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(
    @Arg('userId', () => String) userId: string
  ) {
    await prisma.user.update({
      data: {
        tokenVersion: {
          increment: 1
        }
      },
      where: {
        id: userId
      }
    })

    return true
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Ctx() Ctx: IContext
  ): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      throw new Error('Could not find user')
    }

    const valid = await compare(password, user.password)

    if (!valid) {
      throw new Error('Bad password')
    }

    // //login successful
    sendRefreshToken(Ctx.reply, createRefreshToken(user))

    return {
      accessToken: createAccessToken(user)
    }
  }
}
