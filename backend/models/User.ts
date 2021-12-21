import { prismaClient } from '../prismaClient'
import {
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  UseMiddleware,
  GraphQLISODateTime
} from 'type-graphql'
import { IContext } from '../schemas/RootResolver'
import { throwIfNotAuthenticated } from '../api/authMiddleware'

import { v4 as uuidv4 } from 'uuid'

import {
  EncryptedSecretMutation,
  EncryptedSecretQuery
} from './EncryptedSecret'
import { EncryptedSecretInput, LoginResponse, OTPEvent } from './models'
import * as admin from 'firebase-admin'

import { GraphQLEmailAddress } from 'graphql-scalars'
import { UserGQL } from './generated/User'

import { SettingsConfigGQL } from './generated/SettingsConfig'
import { DeviceGQL } from './generated/Device'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'

@ObjectType()
export class UserBase extends UserGQL {
  constructor(parameters) {
    super()
    Object.assign(this, parameters)
  }

  @Field(() => GraphQLEmailAddress, {
    nullable: true
  })
  email?: string

  setCookiesAndConstructLoginResponse(deviceId: string, ctx: IContext) {
    setNewRefreshToken(this, deviceId, ctx)

    const accessToken = setNewAccessTokenIntoCookie(this, deviceId, ctx)

    return {
      accessToken,
      user: this
    }
  }
}

@ObjectType()
export class UserQuery extends UserBase {
  @Field(() => [DeviceGQL])
  async devices(@Ctx() ctx: IContext) {
    return ctx.prisma.device.findMany({
      where: {
        userId: this.id
      },
      include: {
        User: {
          select: {
            masterDeviceId: true
          }
        }
      }
    })
  }

  @Field(() => GraphQLISODateTime, { nullable: true })
  async lastChangeInSecrets() {
    const res = await prismaClient.encryptedSecret.aggregate({
      where: {
        userId: this.id
      },
      _max: {
        updatedAt: true,
        createdAt: true
      }
    })
    return new Date(
      Math.max(Number(res._max.createdAt), Number(res._max.updatedAt))
    )
  }

  @Field(() => Int)
  async devicesCount() {
    return prismaClient.device.count({
      where: {
        userId: this.id
      }
    })
  }

  //Call this from the findFirst query in me??
  @Field(() => SettingsConfigGQL)
  async settings() {
    return prismaClient.settingsConfig.findFirst({
      where: {
        userId: this.id
      }
    })
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecrets() {
    return prismaClient.encryptedSecret.findMany({
      where: {
        userId: this.id
      }
    })
  }

  @Field(() => Boolean)
  async sendAuthMessage(
    @Arg('location', () => String) location: string,
    @Arg('time', () => String) time: string,
    @Arg('device', () => String) device: string,
    @Arg('pageName', () => String) pageName: string
  ) {
    let user = await prismaClient.user.findFirst({
      where: {
        id: this.id
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
              userId: this.id,
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
}

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => Boolean)
  // TODO remove before putting into prod
  async addCookie(@Ctx() context: IContext) {
    const firstDev = await prismaClient.device.findFirst()
    this.setCookiesAndConstructLoginResponse(firstDev!.id, context)
  }

  @Field(() => DeviceGQL)
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('deviceId', () => String) deviceId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    const ipAddress: string = context.getIpAddress()

    return await prismaClient.device.create({
      data: {
        name: name,
        id: deviceId,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: this.id,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: 60
      }
    })
  }

  // @Field(() => Boolean)
  // async createSecretUsageEvent(
  //   @Arg('data', () => OTPEvent) event: OTPEvent,
  //   @Ctx() context: IContext
  // ) {
  //   try {
  //     await prisma.secretUsageEvent.create({
  //       data: {
  //         kind: event.kind,
  //         url: event.url,
  //         deviceId: context.request.
  //         userId: this.id,
  //         ipAddress: context.getIpAddress()
  //       }
  //     })
  //     return true
  //   } catch (error) {
  //     console.log(error)
  //     return false
  //   }
  // }

  @Field(() => EncryptedSecretQuery)
  async addEncryptedSecret(
    @Arg('payload', () => EncryptedSecretInput) payload: EncryptedSecretInput
  ) {
    return prismaClient.encryptedSecret.create({
      data: {
        version: 1,
        userId: this.id,
        ...payload
      }
    })
  }

  @Field(() => DeviceGQL)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    return prismaClient.device.update({
      data: {
        firebaseToken: firebaseToken
      },
      where: {
        id: this.masterDeviceId
      }
    })
  }

  @Field(() => SettingsConfigGQL)
  async updateSettings(
    @Arg('twoFA', () => Boolean) twoFA: boolean,
    @Arg('homeUI', () => String) homeUI: string,
    @Arg('lockTime', () => Int) lockTime: number,
    @Arg('noHandsLogin', () => Boolean) noHandsLogin: boolean
  ) {
    return prismaClient.settingsConfig.upsert({
      where: {
        userId: this.id
      },
      update: {
        homeUI: homeUI,
        lockTime: lockTime,
        noHandsLogin: noHandsLogin,
        twoFA: twoFA,
        userId: this.id
      },
      create: {
        userId: this.id,
        homeUI: homeUI,
        lockTime: lockTime,
        noHandsLogin: noHandsLogin,
        twoFA: twoFA
      }
    })
  }

  //For testing purposes
  @Field(() => UserGQL)
  async revokeRefreshTokensForUser() {
    return prismaClient.user.update({
      data: {
        tokenVersion: {
          increment: 1
        }
      },
      where: {
        id: this.id
      }
    })
  }

  @Field(() => Boolean)
  async approveDevice(@Arg('success', () => Boolean) success: Boolean) {
    // TODO check current device is master
    let user = await prismaClient.user.findFirst({
      where: {
        id: this.id
      }
    })
    if (user?.masterDeviceId) {
      let device = await prismaClient.device.findFirst({
        where: {
          id: user?.masterDeviceId
        }
      })

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
    }
  }
}
