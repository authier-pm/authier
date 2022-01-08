import {
  authenticateFromToken,
  throwIfNotAuthenticated
} from '../api/authMiddleware'
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
import { prismaClient } from '../prismaClient'
import { hash, compare } from 'bcrypt'
import { FastifyReply, FastifyRequest } from 'fastify'

import {
  DecryptionChallengeResponse,
  LoginResponse,
  OTPEvent
} from '../models/models'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'

import { verify } from 'jsonwebtoken'
import * as admin from 'firebase-admin'
import { UserQuery } from '../models/UserQuery'
import { UserMutation } from '../models/UserMutation'

import { GraphqlError } from '../api/GraphqlError'
import { WebInputElement } from '../models/WebInputElement'
import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLUUID
} from 'graphql-scalars'
import debug from 'debug'
import { RegisterDeviceInput } from '../models/AuthInputs'

import {
  DecryptionChallenge,
  Device,
  prisma,
  User,
  WebInput
} from '@prisma/client'
import { WebInputGQL } from '../models/generated/WebInput'
import { DecryptionChallengeGQL } from '../models/generated/DecryptionChallenge'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from '../utils/getPrismaRelationsFromInfo'

import { DeviceMutation, DeviceQuery } from '../models/Device'
const log = debug('au:RootResolver')

export interface IContext {
  request: FastifyRequest
  reply: FastifyReply
  getIpAddress: () => string
  prisma: typeof prismaClient
}

export interface IJWTPayload {
  userId: string
  deviceId: string
}

export interface IContextAuthenticated extends IContext {
  jwtPayload: IJWTPayload
}

export interface IContextMaybeAuthenticated extends IContext {
  jwtPayload?: IJWTPayload
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
    const user = await prismaClient.user.findFirst({
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

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => UserQuery, { nullable: true })
  @Mutation(() => UserMutation, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me',
    nullable: false
  })
  async me(
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = ctx
    return ctx.prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      include: getPrismaRelationsFromInfo(info)
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => DeviceQuery)
  @Mutation(() => DeviceMutation)
  async currentDevice(
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = ctx
    return ctx.prisma.device.findUnique({
      where: { id: jwtPayload.deviceId },
      include: getPrismaRelationsFromInfo(info)
    })
  }

  @Mutation(() => LoginResponse)
  async registerNewUser(
    @Arg('input', () => RegisterDeviceInput) input: RegisterDeviceInput,
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
      user = await ctx.prisma.user.create({
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
      if (err.code === 'P2002' && err.meta.target[0] === 'email') {
        log('email', email)

        throw new GraphqlError(`User with such email already exists.`)
      }
      if (err.code === 'P2002' && err.meta.target[0] === 'id') {
        log('deviceId', deviceId)
        throw new GraphqlError(
          `Device already exists. You cannot register this device for multiple accounts.`
        )
      }
      throw err
    }

    const device = user.Devices[0]
    user = await ctx.prisma.user.update({
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
    return new UserMutation(user).setCookiesAndConstructLoginResponse(
      device.id,
      ctx
    )
  }

  @Mutation(() => LoginResponse)
  async addNewDeviceForUser(
    @Arg('input', () => RegisterDeviceInput) input: RegisterDeviceInput,
    @Arg('currentAddDeviceSecret', () => GraphQLNonEmptyString)
    currentAddDeviceSecret: string,
    @Ctx() ctx: IContext,
    @Info() info: GraphQLResolveInfo
  ) {
    const include = getPrismaRelationsFromInfo(info, 'user')

    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      include
    })

    if (!user) {
      throw new GraphqlError('User not found')
    }

    if (user?.addDeviceSecret !== currentAddDeviceSecret) {
      // TODO rate limit these attempts and notify current devices
      throw new GraphqlError('Wrong master password used')
    }

    await ctx.prisma.user.update({
      data: {
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
      },
      where: {
        id: user.id
      }
    })

    await ctx.prisma.decryptionChallenge.updateMany({
      where: {
        id: input.decryptionChallengeId,
        deviceId: input.deviceId,
        userId: user.id
      },
      data: { masterPasswordVerifiedAt: new Date() }
    })

    const { firebaseToken, deviceName, deviceId } = input
    const ipAddress = ctx.getIpAddress()

    const deviceData = {
      id: deviceId,
      firstIpAddress: ipAddress,
      lastIpAddress: ipAddress,
      firebaseToken: firebaseToken,
      name: deviceName,
      userId: user.id
    }
    let device = await ctx.prisma.device.findUnique({
      // TODO change this to create
      where: { id: deviceId }
    })

    if (device) {
      if (device.userId !== user.id) {
        throw new GraphqlError('Device is already registered for another user')
      }

      device = await ctx.prisma.device.update({
        data: { logoutAt: null },
        where: { id: device.id }
      })
    } else {
      device = await ctx.prisma.device.create({ data: deviceData })
    }

    return new UserMutation(user).setCookiesAndConstructLoginResponse(
      device.id,
      ctx
    )
  }

  // TODO rate limit this per IP
  @Mutation(() => DecryptionChallengeGQL, {
    description: 'returns a decryption challenge',
    nullable: true
  })
  async deviceDecryptionChallenge(
    @Arg('email', () => GraphQLEmailAddress) email: string,
    @Arg('deviceId', () => GraphQLUUID)
    deviceId: string,
    @Ctx() ctx: IContext
  ) {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
      select: { id: true, addDeviceSecretEncrypted: true }
    })
    if (user) {
      const inLastHour = await ctx.prisma.decryptionChallenge.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 3600000)
          },
          masterPasswordVerifiedAt: null
        }
      })

      if (inLastHour > 5) {
        throw new GraphqlError(
          'Too many decryption challenges, wait for cooldown'
        )
      }

      const challenge = await ctx.prisma.decryptionChallenge.create({
        data: {
          deviceId,
          userId: user.id,
          ipAddress: ctx.getIpAddress()
        },
        include: {
          user: true
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

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => Boolean, {
    nullable: true,
    description: 'removes current device'
  })
  async logout(@Ctx() ctx: IContextAuthenticated) {
    ctx.reply.clearCookie('refresh-token')
    ctx.reply.clearCookie('access-token')
    if (ctx.jwtPayload) {
      const user = await ctx.prisma.user.update({
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
  async webInputs(@Arg('url') url: string, @Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.webInput.findMany({ where: { url } })
  }

  @UseMiddleware(throwIfNotAuthenticated)
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
      const input = await ctx.prisma.webInput.upsert({
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
