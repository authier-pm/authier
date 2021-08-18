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
import { Device } from '../generated/typegraphql-prisma/models'

@ObjectType()
export class UserBase {
  @Field(() => String)
  id: string

  @Field(() => String, { nullable: true })
  email?: string

  @Field(() => String)
  phone_number?: string

  @Field(() => String)
  account_name?: string

  @Field(() => String)
  password: string

  @Field(() => Number)
  tokenVersion: number

  @Field(() => Int)
  primaryDeviceId: number
}

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
            primaryDeviceId: true
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
        firstIpAdress: ipAddress,
        userId: this.id,
        lastIpAdress: ipAddress,
        vaultLockTimeoutSeconds: 60
      }
    })
  }

  @Field(() => Boolean)
  async saveAuths(@Arg('payload', () => String) payload: string) {
    try {
      await prisma.encryptedAuths.upsert({
        create: {
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
    try {
      await prisma.device.update({
        data: {
          firebaseToken: firebaseToken
        },
        where: {
          id: this.primaryDeviceId
        }
      })

      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }
}
