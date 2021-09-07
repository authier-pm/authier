import { prisma } from '../prisma'
import { Arg, Ctx, Field, Int, ObjectType, UseMiddleware } from 'type-graphql'
import { IContext } from '../RootResolver'
import { isAuth } from '../isAuth'
import { EncryptedSecretsType } from '@prisma/client'
import { User } from '../generated/typegraphql-prisma/models/User'
import { Device } from '../generated/typegraphql-prisma/models/Device'
import { SettingsConfig } from '../generated/typegraphql-prisma/models/SettingsConfig'
import { EncryptedSecrets } from '../generated/typegraphql-prisma/models/EncryptedSecrets'

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

  @Field(() => SettingsConfig)
  @UseMiddleware(isAuth)
  async settings() {
    return prisma.settingsConfig.findFirst({
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
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    const ipAddress: string = context.getIpAddress()

    return await prisma.device.create({
      data: {
        name: name,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: this.id,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: 60
      }
    })
  }

  @Field(() => EncryptedSecrets)
  async saveAuths(@Arg('payload', () => String) payload: string) {
    return prisma.encryptedSecrets.upsert({
      create: {
        kind: EncryptedSecretsType.TOTP,
        encrypted: payload,
        version: 1,
        userId: this.id
      },
      update: {
        encrypted: payload
      },
      where: {
        userId_kind: {
          userId: this.id,
          kind: EncryptedSecretsType.TOTP
        }
      }
    })
  }

  @Field(() => EncryptedSecrets)
  async savePasswords(@Arg('payload', () => String) payload: string) {
    return prisma.encryptedSecrets.upsert({
      create: {
        kind: EncryptedSecretsType.LOGIN_CREDENTIALS,
        encrypted: payload,
        version: 1,
        userId: this.id
      },
      update: {
        encrypted: payload
      },
      where: {
        userId_kind: {
          userId: this.id,
          kind: EncryptedSecretsType.LOGIN_CREDENTIALS
        }
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
}
