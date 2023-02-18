import { prismaClient } from '../prisma/prismaClient'
import {
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  GraphQLISODateTime
} from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'

import { EncryptedSecretQuery } from './EncryptedSecret'
import * as admin from 'firebase-admin'

import {
  GraphQLEmailAddress,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'
import { UserGQL } from './generated/UserGQL'

import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'
import { DeviceQuery } from './Device'
import { EmailVerificationGQLScalars } from './generated/EmailVerificationGQL'
import { EmailVerificationType } from '.prisma/client'
import { DecryptionChallengeForApproval } from './DecryptionChallenge'

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
      }
    })
  }

  @Field(() => DeviceQuery)
  async device(@Ctx() ctx: IContext, @Arg('id', () => GraphQLUUID) id: string) {
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
        userId: this.id
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

  @Field(() => Boolean)
  async sendAuthMessage(
    @Arg('location', () => String) location: string,
    @Arg('time', () => GraphQLISODateTime) time: string,
    @Arg('device', () => String) device: string,
    @Arg('pageName', () => String) pageName: string
  ) {
    const user = await prismaClient.user.findUnique({
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

  @Field(() => [DecryptionChallengeForApproval])
  async decryptionChallengesWaiting(@Ctx() ctx: IContextAuthenticated) {
    if (ctx.device.id !== ctx.masterDeviceId) {
      return [] // no point in returning these to other devices than the master
    }

    return ctx.prisma.decryptionChallenge.findMany({
      where: {
        userId: ctx.jwtPayload.userId,
        approvedAt: null,
        rejectedAt: null
      }
    })
  }
}
