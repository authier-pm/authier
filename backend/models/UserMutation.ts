import { prismaClient } from '../prismaClient'
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
import { GraphQLPositiveInt } from 'graphql-scalars'

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => String)
  // TODO remove before putting into prod
  async addCookie(@Ctx() context: IContext) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This is only for development')
    }

    const firstDev = await prismaClient.device.findFirst()
    const { accessToken } = this.setCookiesAndConstructLoginResponse(
      firstDev!.id,
      context
    )
    return accessToken
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

  @Field(() => EncryptedSecretMutation)
  async encryptedSecret(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    return ctx.prisma.encryptedSecret.findUnique({
      where: { id },
      include: getPrismaRelationsFromInfo(info)
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
    const user = await prismaClient.user.findFirst({
      where: {
        id: this.id
      }
    })
    if (user?.masterDeviceId) {
      const device = await prismaClient.device.findFirst({
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

    await prismaClient.$transaction([
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
}
