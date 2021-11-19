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
  Info
} from 'type-graphql'
import { prisma } from './prisma'
import { hash, compare } from 'bcrypt'
import { FastifyReply, FastifyRequest } from 'fastify'

import {
  DecryptionChallengeResponse,
  LoginResponse,
  OTPEvent
} from './models/models'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'

import { verify } from 'jsonwebtoken'
import * as admin from 'firebase-admin'
import { UserQuery, UserMutation } from './models/User'

import { GraphqlError } from './api/GraphqlError'
import { WebInputElement } from './models/WebInputElement'
import { GraphQLEmailAddress, GraphQLUUID } from 'graphql-scalars'
import debug from 'debug'
import { RegisterNewDeviceInput } from './models/AuthInputs'

import { DecryptionChallenge, Device, User, WebInput } from '@prisma/client'
import { WebInputGQL } from './models/generated/WebInput'
import { DecryptionChallengeGQL } from './models/generated/DecryptionChallenge'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from './utils/getPrismaRelationsFromInfo'
const log = debug('au:RootResolver')

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

    log('inCookies', inCookies, 'inHeader', inHeader)

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
  async me(
    @Ctx() context: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = context
    if (jwtPayload) {
      return prisma.user.findUnique({
        where: { id: jwtPayload?.userId },
        include: getPrismaRelationsFromInfo(info)
      })
    }
  }

  setCookiesAndConstructLoginResponse(
    user: User,
    device: Device,
    ctx: IContext
  ) {
    setNewRefreshToken(user, device.id, ctx)

    const accessToken = setNewAccessTokenIntoCookie(user, device.id, ctx)

    return {
      accessToken,
      user
    }
  }

  @Mutation(() => LoginResponse)
  async registerNewUser(
    @Arg('input', () => RegisterNewDeviceInput) input: RegisterNewDeviceInput,
    @Arg('userId', () => GraphQLUUID) userId: string,
    @Ctx() ctx: IContext
  ) {
    const ipAddress = ctx.getIpAddress()
    const {
      email,
      firebaseToken,
      deviceName,
      deviceId,
      addDeviceSecret,
      addDeviceSecretEncrypted
    } = input
    let user: User & { Devices: Device[] }

    try {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          addDeviceSecret,
          addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4,
          Devices: {
            create: {
              id: deviceId,
              firstIpAddress: ipAddress,
              lastIpAddress: ipAddress,
              firebaseToken: firebaseToken,
              name: deviceName
            }
          },
          SettingsConfigs: {
            create: {
              twoFA: true,
              homeUI: 'all',
              lockTime: 28800000,
              noHandsLogin: false
            }
          }
        },
        include: {
          EncryptedSecrets: true,
          Devices: true
        }
      })
    } catch (err: PrismaClientKnownRequestError | any) {
      console.log('~ err', err)
      if (err.code === 'P2002' && err.meta.target[0] === 'email') {
        throw new GraphqlError('User with such email already exists.')
      }
      if (err.code === 'P2002' && err.meta.target[0] === 'id') {
        throw new GraphqlError(
          'Device already exists. You cannot register this device for multiple accounts.'
        )
      }
      throw err
    }

    const device = user.Devices[0]
    user = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        masterDeviceId: device.id
      },
      include: {
        Devices: true
      }
    })
    return this.setCookiesAndConstructLoginResponse(user, device, ctx)
  }

  @Mutation(() => LoginResponse)
  async addNewDeviceForUser(
    @Arg('input', () => RegisterNewDeviceInput) input: RegisterNewDeviceInput,
    @Arg('currentAddDeviceSecret', () => String) currentAddDeviceSecret: string,

    @Ctx() ctx: IContext
  ) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    })

    if (!user) {
      throw new GraphqlError('User not found')
    }

    if (user?.addDeviceSecret !== currentAddDeviceSecret) {
      // TODO rate limit these attempts
      throw new GraphqlError('Wrong master password used')
    }

    await prisma.user.update({
      data: {
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
      },
      where: {
        id: user.id
      }
    })

    const { firebaseToken, deviceName, deviceId } = input
    const ipAddress = ctx.getIpAddress()

    const device = await prisma.device.create({
      data: {
        id: deviceId,
        firstIpAddress: ipAddress,
        lastIpAddress: ipAddress,
        firebaseToken: firebaseToken,
        name: deviceName,
        userId: user.id
      }
    })

    return this.setCookiesAndConstructLoginResponse(user, device, ctx)
  }

  // TODO rate limit this per IP
  @Mutation(() => DecryptionChallengeGQL, {
    description: 'returns a decryption challenge',
    nullable: true
  })
  async deviceDecryptionChallenge(
    @Arg('email', () => GraphQLEmailAddress) email: string,
    @Ctx() ctx: IContext
  ) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, addDeviceSecretEncrypted: true }
    })
    if (user) {
      const inLastHour = await prisma.decryptionChallenge.count({
        where: {
          userId: user.id,
          createdAt: new Date(Date.now() - 3600000),
          masterPasswordVerifiedAt: null
        }
      })
      if (inLastHour > 5) {
        throw new GraphqlError(
          'Too many decryption challenges, wait for cooldown'
        )
      }

      const challenge = await prisma.decryptionChallenge.create({
        data: {
          userId: user.id,
          ipAddress: ctx.getIpAddress()
        }
      })
      // TODO notify user's master device that someone is trying to login
      return {
        ...challenge,
        addDeviceSecretEncrypted: user.addDeviceSecretEncrypted
      }
    }
    return null
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean, {
    nullable: true,
    description: 'removes current device'
  })
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

  @Query(() => [WebInputGQL])
  async webInputs(@Arg('url') url: string) {
    return prisma.webInput.findMany({ where: { url } })
  }

  @UseMiddleware(isAuth)
  @Mutation(() => [WebInputGQL])
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
