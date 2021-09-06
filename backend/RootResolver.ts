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
import { FastifyReply, FastifyRequest } from 'fastify'

import { LoginResponse, OTPEvent } from './models/models'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'

import { verify } from 'jsonwebtoken'
import * as admin from 'firebase-admin'
import serviceAccount from './authier-bc184-firebase-adminsdk-8nuxf-4d2cc873ea.json'
import { UserQuery, UserMutation } from './models/User'
import { Device } from './generated/typegraphql-prisma'

export interface IContext {
  request: FastifyRequest
  reply: FastifyReply
  jwtPayload?: { userId: string }
  getIpAddress: () => string
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
  @Query(() => UserQuery)
  @Mutation(() => UserMutation)
  async user(@Arg('userId', () => String) userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId
      },
      include: {
        Devices: true,
        EncryptedSecrets: true
      }
    })

    return user
  }

  @Query(() => Boolean, {
    description: 'you need to be authenticated to call this resolver'
  })
  authenticated(@Ctx() ctx: IContext) {
    const authorization = ctx.request.headers['authorization']

    try {
      const token = authorization?.split(' ')[1]
      // @ts-expect-error
      const jwtPayload = verify(token, process.env.ACCESS_TOKEN_SECRET!)

      return true
    } catch (err) {
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => UserMutation, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me'
  })
  authenticatedMe(@Ctx() ctx: IContext) {
    return prisma.user.findFirst({
      where: {
        id: ctx.jwtPayload?.userId
      },
      include: {
        Devices: true,
        EncryptedSecrets: true
      }
    })
  }

  //TODO query for info about user
  @UseMiddleware(isAuth)
  @Query(() => UserQuery, { nullable: true })
  me(@Ctx() context: IContext) {
    const { jwtPayload } = context
    if (jwtPayload) {
      return prisma.user.findUnique({ where: { id: jwtPayload?.userId } })
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Device)
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('userId', () => String) userId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    const ipAddress = context.getIpAddress()

    return prisma.device.create({
      data: {
        name: name,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: userId,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: 60
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

    let device = await prisma.device.findFirst({
      where: {
        id: user?.masterDeviceId as number
      }
    })

    try {
      await admin.messaging().sendToDevice(
        device?.firebaseToken as string,
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
  async addOTPEvent(
    @Arg('data', () => OTPEvent) event: OTPEvent,
    @Ctx() context: IContext
  ) {
    try {
      await prisma.oTPCodeEvent.create({
        data: {
          kind: event.kind,
          url: event.url,
          userId: event.userId,
          ipAddress: context.getIpAddress()
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
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    const hashedPassword = await hash(password, 12)

    const ipAddress = ctx.getIpAddress()

    try {
      let user = await prisma.user.create({
        data: {
          email: email,
          passwordHash: hashedPassword
        }
      })

      let device = await prisma.device.create({
        data: {
          firstIpAddress: ipAddress,
          lastIpAddress: ipAddress,
          firebaseToken: firebaseToken,
          name: 'test', // NEED device name
          userId: user.id
        }
      })

      await prisma.settingsConfig.create({
        data: {
          twoFA: true,
          homeUI: 'all',
          lockTime: 28800000,
          noHadsLogin: false,
          userId: user.id
        }
      })

      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          masterDeviceId: device.id
        }
      })
      setNewRefreshToken(user, ctx)

      const accessToken = setNewAccessTokenIntoCookie(user, ctx)

      return {
        accessToken
      }
    } catch (err) {
      console.log(err)
      throw new Error('Register failed')
    }
  }

  @Mutation(() => LoginResponse, { nullable: true })
  async login(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Ctx() ctx: IContext
  ): Promise<LoginResponse | null> {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      include: {
        EncryptedSecrets: true
      }
    })

    if (!user) {
      console.log('Could not find user')
      return null
    }

    const valid = await compare(password, user.passwordHash)

    if (!valid) {
      return null
    }

    // //login successful

    setNewRefreshToken(user, ctx)
    const accessToken = setNewAccessTokenIntoCookie(user, ctx)

    return {
      accessToken,
      secrets: user.EncryptedSecrets
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean, { nullable: true })
  async logout(@Ctx() ctx: IContext) {
    ctx.reply.clearCookie('refresh-token')
    ctx.reply.clearCookie('access-token')
    if (ctx.jwtPayload) {
      const user = await prisma.user.update({
        data: {
          tokenVersion: {
            increment: 1
          }
        },
        where: {
          id: ctx.jwtPayload.userId
        }
      })
      return user.tokenVersion
    }
  }
}
