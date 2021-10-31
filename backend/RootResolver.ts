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
import { FastifyReply, FastifyRequest } from 'fastify'

import { LoginResponse, OTPEvent } from './models/models'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'

import { verify } from 'jsonwebtoken'
import * as admin from 'firebase-admin'
import serviceAccount from './authier-bc184-firebase-adminsdk-8nuxf-4d2cc873ea.json'
import { UserQuery, UserMutation } from './models/User'
import { Device, WebInput } from './generated/typegraphql-prisma'
import { GraphqlError } from './api/GraphqlError'
import { WebInputElement } from './models/WebInputElement'
import { v4 as uuidv4 } from 'uuid'
import debug from 'debug'

export interface IContext {
  request: FastifyRequest
  reply: FastifyReply
  getIpAddress: () => string
}

export interface IContextAuthenticated {
  request: FastifyRequest
  reply: FastifyReply
  jwtPayload: { userId: string }
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
  @Query(() => UserQuery, { nullable: true })
  @Mutation(() => UserMutation, { nullable: true })
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
    const inCookies = ctx.request.cookies['access-token']
    const inHeader = ctx.request.headers['authorization']

    debug.log('inCookiesin', inCookies, 'inHeader', inHeader)

    try {
      if (inHeader) {
        const token = inHeader?.split(' ')[1]
        const jwtPayload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
        return true
      } else if (inCookies) {
        const jwtPayload = verify(inCookies, process.env.ACCESS_TOKEN_SECRET!)
        return true
      }

      return false
    } catch (err) {
      return false
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => UserMutation, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me',
    nullable: true
  })
  authenticatedMe(@Ctx() ctx: IContextAuthenticated) {
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
  async me(@Ctx() context: IContextAuthenticated) {
    const { jwtPayload } = context
    if (jwtPayload) {
      return prisma.user.findUnique({
        where: { id: jwtPayload?.userId }
      })
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
        vaultLockTimeoutSeconds: 60,
        loginSecret: uuidv4()
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

  @Mutation(() => LoginResponse)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    const hashedPassword = await hash(password, 12)

    const ipAddress = ctx.getIpAddress()

    let user

    try {
      user = await prisma.user.create({
        data: {
          email: email,
          passwordHash: hashedPassword,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
        }
      })
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new GraphqlError('User with such email already exists.')
      }
      throw err
    }

    let device = await prisma.device.create({
      data: {
        firstIpAddress: ipAddress,
        lastIpAddress: ipAddress,
        firebaseToken: firebaseToken,
        name: 'test', // NEED device name
        userId: user.id,
        loginSecret: uuidv4()
      }
    })
    console.log(device)

    await prisma.settingsConfig.create({
      data: {
        twoFA: true,
        homeUI: 'all',
        lockTime: 28800000,
        noHandsLogin: false,
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
      accessToken,
      user
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
    console.log(user?.EncryptedSecrets)

    const valid = await compare(password, user.passwordHash)

    if (!valid) {
      return null
    }

    // //login successful
    setNewRefreshToken(user, ctx)
    const accessToken = setNewAccessTokenIntoCookie(user, ctx)

    return {
      accessToken,
      user
    }
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean, { nullable: true })
  async logout(@Ctx() ctx: IContextAuthenticated) {
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

  @Query(() => [WebInput])
  async webInputs(@Arg('url') url: string) {
    return prisma.webInput.findMany({ where: { url } })
  }

  @UseMiddleware(isAuth)
  @Mutation(() => [WebInput])
  async addWebInputs(
    @Arg('webInputs', () => [WebInputElement]) webInputs: WebInputElement[],
    @Ctx() ctx: IContextAuthenticated
  ) {
    const returnedInputs: WebInput[] = []
    for (const webInput of webInputs) {
      const forUpsert = {
        url: webInput.url,
        domPath: webInput.domPath,
        kind: webInput.kind,
        addedByUserId: ctx.jwtPayload.userId
      }
      const input = await prisma.webInput.upsert({
        create: forUpsert,
        update: forUpsert,
        where: {
          webInputIdentifier: {
            url: webInput.url,
            domPath: webInput.domPath
          }
        }
      })
      returnedInputs.push(input)
    }
    return returnedInputs
  }
}
