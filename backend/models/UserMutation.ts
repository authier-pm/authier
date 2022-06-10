import { Arg, Ctx, Field, ID, Info, Int, ObjectType } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import {
  EncryptedSecretMutation,
  EncryptedSecretQuery
} from './EncryptedSecret'
import { EncryptedSecretInput } from './models'
import * as admin from 'firebase-admin'
import { UserGQL } from './generated/User'
import { SettingsConfigGQL } from './generated/SettingsConfig'
import { DeviceGQL } from './generated/Device'
import { UserBase } from './UserQuery'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from '../utils/getPrismaRelationsFromInfo'
import { ChangeMasterPasswordInput } from './AuthInputs'
import { GraphQLNonNegativeInt, GraphQLPositiveInt } from 'graphql-scalars'
import { sendEmail } from '../utils/email'
import { v4 as uuidv4 } from 'uuid'

import { EmailVerificationType } from '@prisma/client'
import { DecryptionChallengeMutation } from './DecryptionChallenge'
import { dmmf } from '../prisma/prismaClient'
import { DeviceInput } from './Device'
import { DeviceMutation } from './Device'

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => String)
  // TODO remove before putting into prod
  async addCookie(@Ctx() ctx: IContext) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This is only for development')
    }

    const firstDev = await ctx.prisma.device.findFirst()
    if (firstDev) {
      const { accessToken } = this.setCookiesAndConstructLoginResponse(
        firstDev.id,
        ctx
      )
      return accessToken
    }
  }

  @Field(() => DeviceMutation)
  async device(@Ctx() ctx: IContext, @Arg('id', () => String) id: string) {
    return ctx.prisma.device.findFirst({
      where: {
        userId: this.id,
        id
      }
    })
  }

  @Field(() => DeviceGQL)
  async addDevice(
    @Arg('device', () => DeviceInput) device: DeviceInput,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    const ipAddress: string = ctx.getIpAddress()

    return await ctx.prisma.device.create({
      data: {
        platform: device.platform,
        name: device.name,
        id: device.id,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: this.id,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: 60
      }
    })
  }

  @Field(() => EncryptedSecretMutation)
  async encryptedSecret(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    return ctx.prisma.encryptedSecret.findUnique({
      where: { id },
      include: getPrismaRelationsFromInfo({
        info,
        rootModel: dmmf.modelMap.EncryptedSecret
      })
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
  @Field(() => [EncryptedSecretQuery])
  async addEncryptedSecrets(
    @Arg('secrets', () => [EncryptedSecretInput])
    secrets: EncryptedSecretInput[],
    @Ctx() ctx: IContext
  ) {
    return ctx.prisma.$transaction(
      // prisma.createMany cannot be used here https://github.com/prisma/prisma/issues/8131
      secrets.map((secret) =>
        ctx.prisma.encryptedSecret.create({
          data: {
            version: 1,
            userId: this.id,
            ...secret
          }
        })
      )
    )
  }

  @Field(() => DeviceGQL)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    return ctx.prisma.device.update({
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
    @Arg('noHandsLogin', () => Boolean) noHandsLogin: boolean,
    @Ctx() ctx: IContext
  ) {
    return ctx.prisma.settingsConfig.upsert({
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

  @Field(() => GraphQLNonNegativeInt)
  async sendEmailVerification(@Ctx() ctx: IContext) {
    if (this.email) {
      let verification = await ctx.prisma.emailVerification.findFirst({
        where: {
          address: this.email
        }
      })

      if (!verification) {
        verification = await ctx.prisma.emailVerification.create({
          data: {
            token: uuidv4(),
            address: this.email,
            userId: this.id,
            kind: EmailVerificationType.PRIMARY
          }
        })
      }

      const link = `${process.env.FRONTEND_URL}/verify-email?token=${verification.token}`

      const res = await sendEmail(
        this.email,

        {
          Subject: 'Verify your email',
          TextPart: `To verify your email, please go here: ${link} \n It will be used as your primary notification channel. If you prefer mobile notifications, install our mobile app.`,
          HTMLPart: `<a href="${link}">Please verify your email.</a> It will be used as your primary notification channel. If you prefer mobile notifications, install our mobile app.`
        }
      )
      return res.body.Messages.length
    }
  }

  //For testing purposes
  @Field(() => UserGQL)
  async revokeRefreshTokensForUser(@Ctx() ctx: IContext) {
    return ctx.prisma.user.update({
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
  async approveDevice(
    @Arg('success', () => Boolean) success: boolean,
    @Ctx() ctx: IContext
  ) {
    // TODO check current device is master
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: this.id
      }
    })
    if (user?.masterDeviceId) {
      const device = await ctx.prisma.device.findFirst({
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

  @Field(() => GraphQLPositiveInt)
  async changeMasterPassword(
    @Arg('input', () => ChangeMasterPasswordInput)
    input: ChangeMasterPasswordInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    const secretsUpdates = input.secrets.map(({ id, ...patch }) => {
      return ctx.prisma.encryptedSecret.update({
        where: { id: id },
        data: patch
      })
    })

    await ctx.prisma.$transaction([
      ...secretsUpdates,
      ctx.prisma.user.update({
        data: {
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
        },
        where: {
          id: this.id
        }
      }),
      ctx.prisma.decryptionChallenge.updateMany({
        where: {
          id: input.decryptionChallengeId,
          deviceId: ctx.jwtPayload.deviceId,
          userId: this.id
        },
        data: { masterPasswordVerifiedAt: new Date() }
      })
    ])
    return secretsUpdates.length
  }

  @Field(() => DecryptionChallengeMutation)
  async decryptionChallenge(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('id', () => Int) id: number
  ) {
    return ctx.prisma.decryptionChallenge.findFirst({
      where: {
        id,
        userId: ctx.jwtPayload.userId
      }
    })
  }
}
