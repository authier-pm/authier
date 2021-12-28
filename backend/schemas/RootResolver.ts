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
import { UserQuery, UserMutation } from '../models/User'

import { GraphqlError } from '../api/GraphqlError'
import { WebInputElement } from '../models/WebInputElement'
import {
  GraphQLEmailAddress,
  GraphQLNonEmptyString,
  GraphQLUUID
} from 'graphql-scalars'
import debug from 'debug'
import { RegisterNewDeviceInput } from '../models/AuthInputs'

import { DecryptionChallenge, Device, User, WebInput } from '@prisma/client'
import { WebInputGQL } from '../models/generated/WebInput'
import { DecryptionChallengeGQL } from '../models/generated/DecryptionChallenge'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from '../utils/getPrismaRelationsFromInfo'
import { UserGQL } from '../models/generated/User'
import { DeviceGQL } from '../models/generated/Device'
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
  @Mutation(() => UserMutation, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me',
    nullable: true
  })
  authenticatedMe(@Ctx() ctx: IContextAuthenticated) {
    return prismaClient.user.findFirst({
      where: {
        id: ctx.jwtPayload?.userId
      },
      include: {
        Devices: true,
        EncryptedSecrets: true
      }
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => UserQuery, { nullable: true })
  async me(@Ctx() context: IContextAuthenticated) {
    const { jwtPayload } = context
    return prismaClient.user.findUnique({
      where: { id: jwtPayload.userId }
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => DeviceQuery)
  @Mutation(() => DeviceMutation)
  async currentDevice(
    @Ctx() context: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = context
    return prismaClient.device.findUnique({
      where: { id: jwtPayload.deviceId }
    })
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
      user = await prismaClient.user.create({
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
    user = await prismaClient.user.update({
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
    @Arg('input', () => RegisterNewDeviceInput) input: RegisterNewDeviceInput,
    @Arg('currentAddDeviceSecret', () => GraphQLNonEmptyString)
    currentAddDeviceSecret: string,

    @Ctx() ctx: IContext
  ) {
    const user = await prismaClient.user.findUnique({
      where: { email: input.email }
    })

    if (!user) {
      throw new GraphqlError('User not found')
    }

    if (user?.addDeviceSecret !== currentAddDeviceSecret) {
      // TODO rate limit these attempts and notify current devices
      throw new GraphqlError('Wrong master password used')
    }

    await prismaClient.user.update({
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

    const device = await prismaClient.device.create({
      data: {
        id: deviceId,
        firstIpAddress: ipAddress,
        lastIpAddress: ipAddress,
        firebaseToken: firebaseToken,
        name: deviceName,
        userId: user.id
      }
    })

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
    @Ctx() ctx: IContext
  ) {
    const user = await prismaClient.user.findUnique({
      where: { email },
      select: { id: true, addDeviceSecretEncrypted: true }
    })
    if (user) {
      const inLastHour = await prismaClient.decryptionChallenge.count({
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

      const challenge = await prismaClient.decryptionChallenge.create({
        data: {
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
      const user = await prismaClient.user.update({
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
    return prismaClient.webInput.findMany({ where: { url } })
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
      const input = await prismaClient.webInput.upsert({
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
