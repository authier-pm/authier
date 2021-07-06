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

import { LoginResponse, OTPEvent, User } from './models/models'
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
export class RootResolver {
  @Query(() => String, {
    description: 'you need to be authenticated to call this resolver'
  })
  @UseMiddleware(isAuth)
  authenticated(@Ctx() Ctx: IContext) {
    return `your user ud is: ${Ctx.payload?.userId}`
  }
  @Mutation(() => String, {
    description: 'you need to be authenticated to call this resolver',
    name: 'authenticated'
  })
  @UseMiddleware(isAuth)
  authenticatedMutations(@Ctx() Ctx: IContext) {
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
  async addOTPEvent(@Arg('data', () => OTPEvent) event: OTPEvent) {
    try {
      await prisma.oTPCodeEvent.create({
        data: {
          kind: event.kind,
          url: event.url,
          userId: event.userId,
          ipAdress: '1'
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  @Mutation(() => LoginResponse)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      let user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword
        }
      })
      return {
        //@ts-expect-error
        accessToken: createAccessToken(user)
      }
    } catch (err) {
      throw new Error('Register failed')
      //return false
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
    //@ts-expect-error
    sendRefreshToken(Ctx.reply, createRefreshToken(user))

    return {
      //@ts-expect-error
      accessToken: createAccessToken(user)
    }
  }
}
