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

export interface IContext {
  request: RawRequestDefaultExpression
  reply: FastifyReply
  payload?: { userId: string }
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
