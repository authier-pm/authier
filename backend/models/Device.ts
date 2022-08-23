import { GraphQLPositiveInt, GraphQLUUID } from 'graphql-scalars'
import {
  Field,
  GraphQLISODateTime,
  Ctx,
  ObjectType,
  Arg,
  InputType
} from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/Device'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEvent'
import { fetch } from 'undici'
import { decorator as mem } from 'mem'
import ms from 'ms'
import { GraphqlError } from '../api/GraphqlError'
import { UserQuery } from './UserQuery'

@InputType()
export class DeviceInput {
  @Field(() => GraphQLUUID, { nullable: false })
  id: string

  @Field()
  name: string

  @Field({ nullable: false })
  platform: string
}

@ObjectType()
export class DeviceQuery extends DeviceGQL {
  @mem({ maxAge: ms('2 days') })
  async getIpGeoLocation(ipAddress: string) {
    if (ipAddress === '127.0.0.1') {
      return {
        city: 'Brno',
        country_name: 'Czech Republic'
      }
    }
    const res = await fetch(
      `https://api.ipbase.com/v2/info?ip=${ipAddress}&apikey=${process.env.FREE_GEOIP_API_KEY}`
    )
    const json: any = await res.json()
    return {
      city: json.data.location.city.name,
      country_name: json.data.location.country.name
    }
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    const lastSyncCondition = { gte: this.lastSyncAt ?? undefined }

    const userData = ctx.prisma.user.findFirst({
      where: {
        id: ctx.jwtPayload.userId
      }
    })

    const userQuery = new UserQuery(userData)
    const pswLimit = await userQuery.PasswordLimits(ctx)
    const TOTPLimit = await userQuery.TOTPLimits(ctx)
    const pswCount = await ctx.prisma.encryptedSecret.count({
      where: {
        userId: ctx.jwtPayload.userId,
        kind: 'LOGIN_CREDENTIALS',
        deletedAt: null
      }
    })

    const TOTPCount = await ctx.prisma.encryptedSecret.count({
      where: {
        userId: ctx.jwtPayload.userId,
        kind: 'TOTP',
        deletedAt: null
      }
    })

    if (pswCount > pswLimit) {
      return new GraphqlError(
        `Password limit exceeded, remove ${pswCount - pswLimit} passwords`
      )
    }

    if (TOTPCount > TOTPLimit) {
      return new GraphqlError(
        `TOTP limit exceeded, remove ${TOTPCount - TOTPLimit} TOTP secrets`
      )
    }

    const res = await ctx.prisma.encryptedSecret.findMany({
      where: {
        OR: [
          {
            userId: this.userId,
            createdAt: lastSyncCondition
          },
          {
            userId: this.userId,
            updatedAt: lastSyncCondition
          },
          {
            userId: this.userId,
            deletedAt: lastSyncCondition
          }
        ]
      }
    })
    return res
  }

  @Field(() => String)
  async lastGeoLocation() {
    const geoIp = await this.getIpGeoLocation(this.lastIpAddress)
    return geoIp.city + ', ' + geoIp.country_name
  }

  // @Field(() => String)
  // async isMaster(
  //   @Ctx() ctx: IContextAuthenticated
  // ) {

  //   return ctx.user.
  // }
}

@ObjectType()
export class DeviceMutation extends DeviceGQLScalars {
  @Field(() => GraphQLISODateTime)
  async markAsSynced(@Ctx() ctx: IContext) {
    const syncedAt = new Date()
    await ctx.prisma.device.update({
      data: {
        lastSyncAt: syncedAt
      },
      where: {
        id: this.id
      }
    })
    return syncedAt
  }

  @Field(() => SecretUsageEventGQLScalars)
  async reportSecretUsageEvent(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('kind') kind: string,
    @Arg('secretId', () => GraphQLUUID) secretId: string,
    @Arg('webInputId', () => GraphQLPositiveInt) webInputId: number
  ) {
    const res = await ctx.prisma.secretUsageEvent.create({
      data: {
        ipAddress: ctx.getIpAddress(),
        kind,
        timestamp: new Date(),
        secretId,
        userId: this.userId,
        deviceId: this.id,
        webInputId
      }
    })
    return res
  }

  @Field(() => DeviceGQL)
  async rename(@Ctx() ctx: IContextAuthenticated, @Arg('name') name: string) {
    return ctx.prisma.device.update({
      data: {
        name
      },
      where: {
        id: this.id
      }
    })
  }

  @Field(() => DeviceGQL)
  async logout(@Ctx() ctx: IContextAuthenticated) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: this.userId
      }
    })

    if (this.id === user?.masterDeviceId) {
      throw new GraphqlError('You cannot logout master device')
    }

    if (ctx.jwtPayload.deviceId === this.id) {
      ctx.reply.clearCookie('refresh-token')
      ctx.reply.clearCookie('access-token')
    }

    return await ctx.prisma.device.update({
      where: {
        id: this.id
      },
      data: { logoutAt: new Date() }
    })
  }

  @Field(() => Boolean, {
    description: 'user has to approve it when they log in again on that device'
  })
  async removeDevice(@Ctx() ctx: IContextAuthenticated) {
    await this.logout(ctx)

    await ctx.prisma.$transaction([
      ctx.prisma.device.delete({
        where: {
          id: this.id
        }
      }),
      ctx.prisma.decryptionChallenge.deleteMany({
        where: {
          deviceId: this.id
        }
      })
    ])
    return true
  }
}
