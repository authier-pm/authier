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
export class User extends UserBase {
  @Field(() => LoginResponse)
  async login(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Ctx() Ctx: IContext
  ): Promise<LoginResponse | null> {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      include: {
        auths: true
      }
    })

    if (!user) {
      console.log('Could not find user')
      return null
    }

    const valid = await compare(password, user.password)

    if (!valid) {
      return null
    }

    // //login successful
    //@ts-expect-error
    sendRefreshToken(Ctx.reply, createRefreshToken(user))

    return {
      //@ts-expect-error
      accessToken: createAccessToken(user),
      auths: user.auths as EncryptedAuths
    }
  }

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

  @Field(() => Boolean)
  authenticated(@Ctx() ctx: IContext) {
    const authorization = ctx.request.headers['authorization']

    try {
      const token = authorization?.split(' ')[1]
      // @ts-expect-error
      const jwtPayload = verify(token, process.env.ACCESS_TOKEN_SECRET!)

      return true
    } catch (err) {
      return false
    }
  }
}

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => LoginResponse)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() context: IContext
  ) {
    console.log(context)
    const hashedPassword = await hash(password, 12)

    //@ts-expect-error
    const ipAddress: string =
      context.request.headers['x-forwarded-for'] ||
      context.request.socket.remoteAddress

    try {
      let user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword
        }
      })

      let device = await prisma.device.create({
        data: {
          firstIpAdress: ipAddress,
          lastIpAdress: ipAddress,
          firebaseToken: firebaseToken,
          name: 'test',
          userId: user.id
        }
      })
      console.log(user)
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          primaryDeviceId: device.id
        }
      })

      return {
        //@ts-expect-error
        accessToken: createAccessToken(user)
      }
    } catch (err) {
      console.log(err)
      throw new Error('Register failed')
    }
  }

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
