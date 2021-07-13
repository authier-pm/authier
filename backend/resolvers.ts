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
  UseMiddleware,
  Int
} from 'type-graphql'
import { prisma } from './prisma'
import { hash, compare } from 'bcrypt'
import { FastifyReply, RawRequestDefaultExpression } from 'fastify'

import { EncryptedAuths, LoginResponse, OTPEvent, User } from './models/models'
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
    return Ctx.payload?.userId
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
      throw new Error('You are missing a token')
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
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('firstIpAdress', () => String) firstIpAdress: string,
    @Arg('userId', () => String) userId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    try {
      await prisma.device.create({
        data: {
          name: name,
          userId: userId,
          firstIpAdress: firstIpAdress,
          lastIpAdress: '192.168.100.128/25', // <=== CHANGE
          firebaseToken: firebaseToken
        }
      })
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

  @Query(() => Int)
  async DeviceCount(@Arg('userId', () => String) userId: string) {
    try {
      return await prisma.device.count({
        where: {
          userId: userId
        }
      })
    } catch (error) {
      console.log(error)
      return 0
    }
  }

  @Mutation(() => Boolean)
  async saveAuths(
    @Arg('userId', () => String) userId: string,
    @Arg('payload', () => String) payload: string
  ) {
    try {
      await prisma.encryptedAuths.upsert({
        create: {
          encrypted: payload,
          version: 1,
          userId: userId
        },
        update: {
          encrypted: payload
        },
        where: {
          userId: userId
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
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
      console.log(error)
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
      },
      include: {
        auths: true
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
      accessToken: createAccessToken(user),
      auths: user.auths as EncryptedAuths
    }
  }
}
