import { throwIfNotAuthenticated } from '../api/authMiddleware'
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
import { dmmf, prismaClient } from '../prisma/prismaClient'
import { FastifyReply, FastifyRequest } from 'fastify'

import { LoginResponse } from '../models/models'

import { verify } from 'jsonwebtoken'
import { UserQuery } from '../models/UserQuery'
import { UserMutation } from '../models/UserMutation'

import { GraphqlError } from '../api/GraphqlError'
import { WebInputElement } from '../models/WebInputElement'
import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'
import debug from 'debug'
import {
  AddNewDeviceInput,
  RegisterNewAccountInput
} from '../models/AuthInputs'

import { Device, User, WebInput } from '@prisma/client'
import { WebInputGQL } from '../models/generated/WebInput'
import { DecryptionChallengeGQL } from '../models/generated/DecryptionChallenge'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from '../utils/getPrismaRelationsFromInfo'

import { DeviceInput, DeviceMutation, DeviceQuery } from '../models/Device'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeForApproval,
  DecryptionChallengeMutation,
  DecryptionChallengeUnion
} from '../models/DecryptionChallenge'
import { sendEmail } from '../utils/email'
import { plainToClass } from 'class-transformer'

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
    const include = getPrismaRelationsFromInfo({
      info,
      rootModel: dmmf.modelMap.User
    })

    return ctx.prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      include
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
      include: getPrismaRelationsFromInfo({
        info,
        rootModel: dmmf.modelMap.Device
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
          loginCredentialsLimit: 50,
          TOTPlimit: 4,
          Devices: {
            create: {
              platform: input.devicePlatform,
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

  // TODO rate limit this per IP
  @Mutation(() => DecryptionChallengeUnion, {
    // TODO return a union instead
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

    const user = await ctx.prisma.user.findUnique({
      where: { email },
      select: { id: true, addDeviceSecretEncrypted: true, encryptionSalt: true }
    })

    if (!user) {
      throw new GraphqlError('login failed')
    }
    const isBlocked = await ctx.prisma.decryptionChallenge.findFirst({
      where: {
        userId: user.id,
        blockIp: true,
        ipAddress
      }
    })
    if (isBlocked) {
      throw new GraphqlError('login failed')
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

    let challenge = await ctx.prisma.decryptionChallenge.findFirst({
      where: {
        deviceId: deviceInput.id,
        userId: user.id
      }
    })
    console.log('CHALLENGE', challenge, device)
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
      // TODO send notification to user
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
      // TODO enable when we have device management in the vault
      return plainToClass(DecryptionChallengeForApproval, {
        id: challenge.id,
        approvedAt: challenge.approvedAt
      })
    }

    // use has approved this device in the past, we can return the challenge including salt and encrypted secret
    return plainToClass(DecryptionChallengeApproved, {
      ...challenge,

      addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
      encryptionSalt: user.encryptionSalt
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => GraphQLPositiveInt, {
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
    console.log(ctx)
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
        host: new URL(webInput.url).host,
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
