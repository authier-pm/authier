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
import { UserQuery, UserMutation } from './models/User'

import { GraphqlError } from './api/GraphqlError'
import { WebInputElement } from './models/WebInputElement'
import { GraphQLEmailAddress, GraphQLUUID } from 'graphql-scalars'
import debug from 'debug'
import { RegisterNewDeviceInput } from './models/AuthInputs'

import { Device, User, WebInput } from '@prisma/client'
import { WebInputGQL } from './models/generated/WebInput'
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
  async me(@Ctx() context: IContextAuthenticated) {
    const { jwtPayload } = context
    if (jwtPayload) {
      return prisma.user.findUnique({
        where: { id: jwtPayload?.userId }
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
    let user: User

    try {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          addDeviceSecret,
          addDeviceSecretEncrypted,
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
        id: deviceId,
        firstIpAddress: ipAddress,
        lastIpAddress: ipAddress,
        firebaseToken: firebaseToken,
        name: deviceName,
        userId: user.id
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
  @Query(() => [String], { description: 'returns a decryption challenge' })
  async deviceDecryptionChallenge(
    @Arg('email', () => GraphQLEmailAddress) email: string
  ) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { addDeviceSecretEncrypted: true }
    })
    return user?.addDeviceSecretEncrypted
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
