import { throwIfNotAuthenticated } from '../api/authMiddleware'
import {
  Query,
  Resolver,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
  Info,
  Int
} from 'type-graphql'
import { dmmf, prismaClient } from '../prisma/prismaClient'
import { FastifyReply, FastifyRequest } from 'fastify'
import { LoginResponse } from '../models/models'

import { verify } from 'jsonwebtoken'
import { UserQuery } from '../models/UserQuery'
import { UserMutation } from '../models/UserMutation'
import { constructURL } from '../../shared/urlUtils'

import { GraphqlError } from '../api/GraphqlError'
import { WebInputElement } from '../models/WebInputElement'
import { GraphQLEmailAddress, GraphQLUUID } from 'graphql-scalars'
import debug from 'debug'
import { RegisterNewAccountInput } from '../models/AuthInputs'

import { Device, User, WebInput } from '.prisma/client'

import { WebInputGQL } from '../models/generated/WebInputGQL'

import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromGQLInfo } from '../utils/getPrismaRelationsFromInfo'

import { DeviceInput, DeviceMutation, DeviceQuery } from '../models/Device'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeForApproval,
  DecryptionChallengeUnion
} from '../models/DecryptionChallenge'
import { plainToClass } from 'class-transformer'
import type { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import admin from 'firebase-admin'
import { isTorExit } from './isTorExit'
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
  device: Device
  masterDeviceId: string | null | undefined
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
  @Query(() => String)
  osTime() {
    return new Date().toISOString()
  }

  @Query(() => Boolean, {
    description: 'you need to be authenticated to call this resolver'
  })
  authenticated(@Ctx() ctx: IContext) {
    const inCookies = ctx.request.cookies['access-token']
    const inHeader = ctx.request.headers['authorization']

    try {
      if (inHeader) {
        const token = inHeader?.split(' ')[1]
        verify(token, process.env.ACCESS_TOKEN_SECRET!)
        return true
      } else if (inCookies) {
        verify(inCookies, process.env.ACCESS_TOKEN_SECRET!)
        return true
      }

      return false
    } catch (err) {
      return false
    }
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => UserQuery)
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

    const include = getPrismaRelationsFromGQLInfo({
      info,
      rootModel: dmmf.models.User
    })

    const tmp = await ctx.prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      include
    })

    return tmp
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
      include: getPrismaRelationsFromGQLInfo({
        info,
        rootModel: dmmf.models.Device
      })
    })
  }

  @Mutation(() => LoginResponse)
  async registerNewUser(
    @Arg('input', () => RegisterNewAccountInput) input: RegisterNewAccountInput,
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
      addDeviceSecretEncrypted,
      encryptionSalt
    } = input
    let user: User & { Devices: Device[] }

    try {
      user = await ctx.prisma.user.create({
        data: {
          id: userId,
          email: email,
          addDeviceSecret,
          addDeviceSecretEncrypted,
          encryptionSalt,
          deviceRecoveryCooldownMinutes: 16 * 60, // 16 hours should be plenty enough
          loginCredentialsLimit: 40, // default limit
          TOTPlimit: 3,
          Devices: {
            create: {
              syncTOTP: true,
              platform: input.devicePlatform,
              id: deviceId,
              firstIpAddress: ipAddress,
              lastIpAddress: ipAddress,
              firebaseToken: firebaseToken,
              name: deviceName
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
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `deleting device ${deviceId} because we are in dev mode and we don't care about the other account`
          )
          await prismaClient.device.delete({
            where: { id: deviceId }
          })
          return this.registerNewUser(input, userId, ctx)
        } else {
          throw new GraphqlError(
            `Device ${deviceId} already exists. You cannot use a device with multiple accounts.`
          )
        }
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

  // TODO rate limit this per IP
  @Mutation(() => DecryptionChallengeUnion, {
    description: 'returns a decryption challenge',
    nullable: true
  })
  async deviceDecryptionChallenge(
    @Arg('email', () => GraphQLEmailAddress) email: string,
    @Arg('deviceInput', () => DeviceInput)
    deviceInput: DeviceInput,
    @Ctx() ctx: IContext
  ) {
    const ipAddress = ctx.getIpAddress()

    if (await isTorExit(ipAddress)) {
      throw new GraphqlError(
        'Tor exit nodes are prohibited from login/adding new devices.'
      )
    }

    const user = await ctx.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        addDeviceSecretEncrypted: true,
        encryptionSalt: true,
        masterDevice: true
      }
    })

    if (!user) {
      throw new GraphqlError('Login failed, create a new account.')
    }
    const isBlocked = await ctx.prisma.decryptionChallenge.findFirst({
      where: {
        userId: user.id,
        blockIp: true,
        ipAddress
      }
    })

    if (isBlocked) {
      throw new GraphqlError('Login failed, try again later.')
    }

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

    const device = await ctx.prisma.device.findUnique({
      where: { id: deviceInput.id }
    })

    console.log('device', device)

    let challenge = await ctx.prisma.decryptionChallenge.findFirst({
      where: {
        deviceId: deviceInput.id,
        userId: user.id
      }
    })

    //TODO: Check this condition, not sure what is this doing
    if (device) {
      if (!challenge) {
        const deviceCount = await ctx.prisma.device.count({
          where: {
            userId: user.id
          }
        })
        if (deviceCount === 1) {
          // user has only one device
          challenge = await ctx.prisma.decryptionChallenge.create({
            data: {
              deviceId: deviceInput.id,
              deviceName: deviceInput.name,
              userId: user.id,
              ipAddress,
              approvedAt: device.createdAt // we mark this as approved immediately, because user has only one device
            }
          })
        }
      }
    }

    if (challenge?.rejectedAt) {
      // someone tried to login with this device and it was rejected in the past, we don't want to create a new challenge
      throw new GraphqlError('login failed')
    }

    if (!challenge) {
      // TODO: Will we have notifications for browser?
      if (
        user.masterDevice?.firebaseToken &&
        user.masterDevice.firebaseToken.length > 10
      ) {
        console.log('sending notification to')
        await admin.messaging().sendToDevice(user.masterDevice.firebaseToken, {
          notification: {
            title: 'New device login!',
            body: 'New device is trying to log in.'
          },
          data: {
            type: 'Devices'
          }
        })
      }
      challenge = await ctx.prisma.decryptionChallenge.create({
        data: {
          deviceId: deviceInput.id,
          deviceName: deviceInput.name,
          userId: user.id,
          ipAddress: ctx.getIpAddress()
        }
      })
    }

    if (!challenge.approvedAt) {
      // TODO: enable when we have device management in the vault
      return plainToClass(DecryptionChallengeForApproval, {
        id: challenge.id,
        approvedAt: challenge.approvedAt
      })
    }

    // user has approved this device in the past, we can return the challenge including salt and encrypted secret
    return plainToClass(DecryptionChallengeApproved, {
      ...challenge,

      addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
      encryptionSalt: user.encryptionSalt
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => Int, {
    nullable: true,
    deprecationReason: 'prefer device methods',
    description:
      'removes current device. Returns null if user is not authenticated, alias for device logout/remove methods'
  })
  async logout(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('removeDevice', { nullable: true }) removeDevice: boolean
  ) {
    ctx.reply.clearCookie('refresh-token')
    ctx.reply.clearCookie('access-token')

    if (!ctx.jwtPayload) {
      return null
    }
    const user = await ctx.prisma.user.update({
      data: {
        Devices: {
          update: {
            where: {
              id: ctx.jwtPayload.deviceId
            },
            data: {
              logoutAt: new Date()
            }
          }
        }
      },
      where: {
        id: ctx.jwtPayload.userId
      }
    })

    if (removeDevice) {
      await ctx.prisma.$transaction([
        ctx.prisma.device.delete({
          where: {
            id: ctx.jwtPayload.deviceId
          }
        }),
        ctx.prisma.decryptionChallenge.deleteMany({
          where: {
            deviceId: ctx.jwtPayload.deviceId
          }
        })
      ])
    }
    return user.tokenVersion
  }

  @Query(() => [WebInputGQL])
  async webInputs(
    @Arg('host') host: string,
    @Ctx() ctx: IContextAuthenticated
  ) {
    return ctx.prisma.webInput.findMany({ where: { host } })
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
        host: constructURL(webInput.url).host,
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
      // @ts-ignore TODO figure out why this errors only on local, but not on CI
      returnedInputs.push(input)
    }
    return returnedInputs
  }
}
