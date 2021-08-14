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

import {
  Device,
  EncryptedAuths,
  LoginResponse,
  OTPEvent,
  User
} from './models/models'
import { createAccessToken, createRefreshToken } from './auth'
import { sendRefreshToken } from './sendRefreshToken'
import { verify } from 'jsonwebtoken'
import * as admin from 'firebase-admin'
import serviceAccount from './authier-bc184-firebase-adminsdk-8nuxf-4d2cc873ea.json'

export interface IContext {
  request: RawRequestDefaultExpression
  reply: FastifyReply
  jwtPayload?: { userId: string }
}

export interface Payload {
  userId: string
  iat: number
  exp: number
}

admin.initializeApp({
  //@ts-expect-error
  credential: admin.credential.cert(serviceAccount)
})

@Resolver()
export class RootResolver {
  @Query(() => String, {
    description: 'you need to be authenticated to call this resolver'
  })
  authenticated(@Ctx() ctx: IContext) {
    const authorization = ctx.request.headers['authorization']

    try {
      const token = authorization?.split(' ')[1]
      // @ts-expect-error
      const jwtPayload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
      // @ts-expect-error
      return jwtPayload?.userId
    } catch (err) {
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => String, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me'
  })
  authenticatedMe(@Ctx() Ctx: IContext) {
    return `your user ud is: ${Ctx.jwtPayload?.userId}`
  }

  // @Query(() => [User])
  // async users() {
  //   return prisma.user.findMany()
  // }

  // query for info about user
  @UseMiddleware(isAuth)
  @Query(() => User, { nullable: true })
  me(@Ctx() context: IContext) {
    const authorization = context.request.headers['authorization']

    if (!authorization) {
      throw new Error('You are missing a token')
    }

    try {
      const token = authorization.split(' ')[1]
      const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
      context.jwtPayload = payload as Payload
      //@ts-expect-error
      return prisma.user.findUnique({ where: { id: payload.userId } })
    } catch (err) {
      console.log(err)
      return null
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('userId', () => String) userId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    // @ts-expect-error
    const ipAddress: string =
      context.request.headers['x-forwarded-for'] ||
      context.request.socket.remoteAddress

    try {
      await prisma.device.create({
        data: {
          name: name,
          firebaseToken: firebaseToken,
          firstIpAdress: ipAddress,
          userId: userId,
          lastIpAdress: ipAddress
        }
      })
      return true
    } catch (er) {
      console.log(er)
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async firebaseToken(
    @Arg('userId', () => String) userId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    try {
      await prisma.user.update({
        data: {
          firebaseToken: firebaseToken
        },
        where: {
          id: userId
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Query(() => [Device])
  async myDevices(@Arg('userId', () => String) userId: string) {
    return await prisma.device.findMany({
      where: {
        userId: userId
      },
      include: {
        User: {
          select: {
            primaryDeviceId: true
          }
        }
      }
    })
  }

  @UseMiddleware(isAuth)
  @Query(() => Int)
  async devicesCount(@Arg('userId', () => String) userId: string) {
    return prisma.device.count({
      where: {
        userId: userId
      }
    })
  }

  @UseMiddleware(isAuth)
  @Query(() => Boolean)
  async sendAuthMessage(
    @Arg('userId', () => String) userId: string,
    @Arg('location', () => String) location: string,
    @Arg('time', () => String) time: string,
    @Arg('device', () => String) device: string,
    @Arg('pageName', () => String) pageName: string
  ) {
    let user = await prisma.user.findFirst({
      where: {
        id: userId
      },
      include: {
        Devices: true
      }
    })

    if (user) {
      try {
        await admin.messaging().sendToDevice(
          user.Devices[0].firebaseToken, // ['token_1', 'token_2', ...]
          {
            data: {
              userId: userId,
              location: location,
              time: time,
              device: device,
              pageName: pageName
            }
          },
          {
            // Required for background/quit data-only messages on iOS
            contentAvailable: true,
            // Required for background/quit data-only messages on Android
            priority: 'high'
          }
        )
        return true
      } catch (err) {
        console.log(err)
        return false
      }
    } else {
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Query(() => Boolean)
  async sendConfirmation(
    @Arg('userId', () => String) userId: string,
    @Arg('success', () => Boolean) success: Boolean
  ) {
    let user = await prisma.user.findFirst({
      where: {
        id: userId
      }
    })

    try {
      await admin.messaging().sendToDevice(
        user?.firebaseToken as string,
        {
          data: {
            success: success.toString()
          }
        },
        {}
      )

      return true
    } catch (err) {
      console.log(err)
      return false
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
    @Arg('password', () => String) password: string,
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      let user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          firebaseToken: firebaseToken
        }
      })

      return {
        //@ts-expect-error
        accessToken: createAccessToken(user)
      }
    } catch (err) {
      console.log(err)
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
  ): Promise<LoginResponse | null> {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      include: {
        auths: true
      }
    })

    if (!user) {
      console.log('Could not find user')
      return null
    }

    const valid = await compare(password, user.password)

    if (!valid) {
      return null
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
