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
import { request } from 'undici'
import { decorator as mem } from 'mem'
import ms from 'ms'

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
    const res = await request(
      `https://api.freegeoip.app/json/${ipAddress}apikey=${process.env.FREE_GEOIP_API_KEY}`
    )
    return await res.body.json()
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    const lastSyncCondition = { gte: this.lastSyncAt ?? undefined }

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

  @Field(() => Boolean)
  async removeCurrentDevice(@Ctx() ctx: IContextAuthenticated) {
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
