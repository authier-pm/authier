import { prisma } from '../prisma'
import { Arg, Ctx, Field, Int, ObjectType, UseMiddleware } from 'type-graphql'
import { IContext } from '../RootResolver'
import { isAuth } from '../isAuth'

import { User } from '../generated/typegraphql-prisma/models/User'
import { Device } from '../generated/typegraphql-prisma/models/Device'
import { SettingsConfig } from '../generated/typegraphql-prisma/models/SettingsConfig'

import { v4 as uuidv4 } from 'uuid'
import { EncryptedSecretType } from '../generated/typegraphql-prisma/enums'
import {
  EncryptedSecretMutation,
  EncryptedSecretQuery
} from './EncryptedSecret'
import { EncryptedSecretInput, LoginResponse, OTPEvent } from './models'
import * as admin from 'firebase-admin'
import { RegisterNewDeviceInput } from './AuthInputs'
import { GraphqlError } from '../api/GraphqlError'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'

@ObjectType()
export class UserBase extends User {}

@ObjectType()
export class UserQuery extends UserBase {
  @Field(() => [Device])
  async myDevices() {
    return prisma.device.findMany({
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

  @Field(() => Int)
  async devicesCount() {
    return prisma.device.count({
      where: {
        userId: this.id
      }
    })
  }

  //Call this from the findFirst query in me??
  @Field(() => SettingsConfig)
  async settings() {
    return prisma.settingsConfig.findFirst({
      where: {
        userId: this.id
      }
    })
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecrets() {
    return prisma.encryptedSecret.findMany({
      where: {
        userId: this.id
      }
    })
  }
}

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => Device)
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('deviceId', () => String) deviceId: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    const ipAddress: string = context.getIpAddress()

    return await prisma.device.create({
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
    @Arg('payload', () => EncryptedSecretInput) payload: EncryptedSecretInput,
    @Arg('kind', () => EncryptedSecretType) kind: EncryptedSecretType
  ) {
    return prisma.encryptedSecret.create({
      data: {
        kind,
        encrypted: payload.encrypted,
        version: 1,
        userId: this.id,
        url: payload.url,
        label: payload.label
      }
    })
  }

  @Field(() => Device)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    return prisma.device.update({
      data: {
        firebaseToken: firebaseToken
      },
      where: {
        id: this.masterDeviceId
      }
    })
  }

  @Field(() => SettingsConfig)
  async updateSettings(
    @Arg('twoFA', () => Boolean) twoFA: boolean,
    @Arg('homeUI', () => String) homeUI: string,
    @Arg('lockTime', () => Int) lockTime: number,
    @Arg('noHandsLogin', () => Boolean) noHandsLogin: boolean
  ) {
    return prisma.settingsConfig.upsert({
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
  @Field(() => User)
  async revokeRefreshTokensForUser() {
    return prisma.user.update({
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
  async sendConfirmation(
    @Arg('userId', () => String) userId: string,
    @Arg('success', () => Boolean) success: Boolean
  ) {
    let user = await prisma.user.findFirst({
      where: {
        id: userId
      }
    })
    if (user?.masterDeviceId) {
      let device = await prisma.device.findFirst({
        where: {
          id: user?.masterDeviceId
        }
      })

      try {
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
      } catch (err) {
        console.log(err)
        return false
      }
    }
  }
}
