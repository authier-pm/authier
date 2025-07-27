import { prismaClient } from '../prisma/prismaClient'
import {
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  GraphQLISODateTime
} from 'type-graphql'
import type { IContext, IContextAuthenticated } from './types/ContextTypes'

import { EncryptedSecretQuery } from './EncryptedSecret'

import { GraphQLEmailAddress } from 'graphql-scalars'
import { UserGQL } from './generated/UserGQL'

import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'
import { DeviceQuery } from './Device'
import { EmailVerificationGQLScalars } from './generated/EmailVerificationGQL'
import type { Device } from '@prisma/client'
import { EmailVerificationType } from '@prisma/client'
import { DecryptionChallengeForApproval } from './DecryptionChallenge'
import {
  defaultDeviceSettingSystemValues,
  defaultDeviceSettingUserValuesWithId
} from './defaultDeviceSettingSystemValues'
import { DefaultDeviceSettingsQuery } from './DefaultDeviceSettings'
import { firebaseAdmin, firebaseSendNotification } from '../lib/firebaseAdmin'

@ObjectType()
export class UserBase extends UserGQL {
  constructor(parameters) {
    super()
    Object.assign(this, parameters)
  }

  @Field(() => GraphQLEmailAddress, {
    nullable: true
  })
  declare email: string

  async setCookiesAndConstructLoginResponse(device: Device, ctx: IContext) {
    const userDevice = await ctx.prisma.device.findFirstOrThrow({
      where: {
        userId: this.id,
        id: device.id
      }
    })

    setNewRefreshToken(this, userDevice, ctx)

    const accessToken = setNewAccessTokenIntoCookie(this, userDevice, ctx)

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

  async defaultDeviceSettings(@Ctx() ctx: IContext) {
    const deviceDefaultSettings =
      await ctx.prisma.defaultDeviceSettings.findFirst({
        where: {
          userId: this.id
        }
      })

    return deviceDefaultSettings ?? defaultDeviceSettingUserValuesWithId
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
      orderBy: [
        {
          lastSyncAt: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    })
  }

  @Field(() => DefaultDeviceSettingsQuery)
  async defaultDeviceSettings(@Ctx() ctx: IContext) {
    return super.defaultDeviceSettings(ctx)
  }

  @Field(() => DeviceQuery)
  async device(@Ctx() ctx: IContext, @Arg('id', () => String) id: string) {
    return ctx.prisma.device.findFirst({
      where: {
        userId: this.id,
        id
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
        userId: this.id,
        deletedAt: null
      }
    })
  }

  @Field(() => EmailVerificationGQLScalars, { nullable: true })
  async primaryEmailVerification() {
    return prismaClient.emailVerification.findFirst({
      where: {
        userId: this.id,
        address: this.email,
        kind: EmailVerificationType.PRIMARY
      }
    })
  }
  @Field(() => [EmailVerificationGQLScalars])
  async emailVerifications() {
    return prismaClient.emailVerification.findMany({
      where: {
        userId: this.id
      }
    })
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecrets() {
    return prismaClient.encryptedSecret.findMany({
      where: {
        userId: this.id,
        deletedAt: null
      }
    })
  }

  // TODO use this to send notifications to the master device about unlock and wrong password attempts
  async sendAuthMessage(
    deviceId: string,
    title: string,
    body: string,
    type: string
  ) {
    console.log('NOTIFICATION')
    const user = await prismaClient.user.findUnique({
      where: {
        id: this.id
      },
      include: {
        Devices: {
          where: {
            id: deviceId
          }
        }
      }
    })

    if (!user || deviceId === user.masterDeviceId) {
      console.log('no user or master device or firebase token')
      return false // no point in sending messages to the master device
    }

    const masterDevice = await prismaClient.device.findUnique({
      where: {
        id: user?.masterDeviceId as string
      }
    })

    if (!masterDevice?.firebaseToken || masterDevice.firebaseToken.length < 8) {
      console.log('no firebase token')
      return false // no point in sending messages to the master deviceId
    }

    try {
      await firebaseSendNotification({
        token: masterDevice.firebaseToken,
        notification: {
          title: title,
          body: user.Devices.find(({ id }) => id === deviceId)?.name + body
        },
        data: {
          type: type
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  @Field(() => [DecryptionChallengeForApproval])
  async decryptionChallengesWaiting(@Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.decryptionChallenge.findMany({
      where: {
        userId: ctx.jwtPayload.userId,
        approvedAt: null,
        rejectedAt: null
      }
    })
  }
}
