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
import { LoginResponse, OTPEvent } from './models'
import * as admin from 'firebase-admin'

import { GraphQLEmailAddress } from 'graphql-scalars'
import { UserGQL } from './generated/User'

import { SettingsConfigGQL } from './generated/SettingsConfig'
import { DeviceGQL } from './generated/Device'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'
import { DeviceQuery } from './Device'

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
      user: {
        ...this,
        //Remove deleted items
        EncryptedSecrets:
          this.EncryptedSecrets?.length > 0
            ? this.EncryptedSecrets.filter(({ deletedAt }) => !deletedAt)
            : []
      }
    }
  }
}

@ObjectType()
export class UserQuery extends UserBase {
  @Field(() => [DeviceQuery])
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
  async encryptedSecrets(
    @Arg('fromDate', () => GraphQLISODateTime, { nullable: true })
    fromDate: string
  ) {
    return prismaClient.encryptedSecret.findMany({
      where: {
        userId: this.id,
        deletedAt: null
      }
    })
  }

  @Field(() => Boolean)
  async sendAuthMessage(
    @Arg('location', () => String) location: string,
    @Arg('time', () => GraphQLISODateTime) time: string,
    @Arg('device', () => String) device: string,
    @Arg('pageName', () => String) pageName: string
  ) {
    const user = await prismaClient.user.findFirst({
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
