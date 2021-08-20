import { prisma } from '../prisma'
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  ObjectType,
  UseMiddleware
} from 'type-graphql'
import { IContext } from '../RootResolver'
import { createAccessToken, createRefreshToken } from '../auth'
import { sendRefreshToken } from '../sendRefreshToken'
import { compare, hash } from 'bcrypt'
import { isAuth } from '../isAuth'
import { EncryptedAuths, LoginResponse } from './models'
import { Device, User } from '../generated/typegraphql-prisma/models'
import { EncryptedSecretsType } from '@prisma/client'

@ObjectType()
export class UserBase extends User {}

@ObjectType()
export class UserQuery extends UserBase {
  @Field(() => [Device])
  @UseMiddleware(isAuth)
  async myDevices() {
    return await prisma.device.findMany({
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
  @UseMiddleware(isAuth)
  async devicesCount() {
    return prisma.device.count({
      where: {
        userId: this.id
      }
    })
  }
}

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => Device)
  @UseMiddleware(isAuth)
  async addDevice(
    @Arg('name', () => String) name: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    // @ts-expect-error
    const ipAddress: string =
      context.request.headers['x-forwarded-for'] ||
      context.request.socket.remoteAddress

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

  @Field(() => Boolean)
  async saveAuths(@Arg('payload', () => String) payload: string) {
    try {
      await prisma.encryptedSecrets.upsert({
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
          userId: this.id
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  @Field(() => Boolean)
  @UseMiddleware(isAuth)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    try {
      await prisma.device.update({
        data: {
          firebaseToken: firebaseToken
        },
        where: {
          id: this.masterDeviceId
        }
      })

      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }
}
