import { GraphQLPositiveInt, GraphQLUUID } from 'graphql-scalars'
import { Field, GraphQLISODateTime, Ctx, ObjectType, Arg } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/Device'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEvent'
import { request } from 'undici'
import mem from 'mem'
import ms from 'ms'

const getIpGeoLocation = mem(
  async (ipAddress: string) => {
    const res = await request(
      `https://api.freegeoip.app/json/${ipAddress}apikey=${process.env.FREE_GEOIP_API_KEY}`
    )
    return await res.body.json()
  },
  { maxAge: ms('2 days') }
)

@ObjectType()
export class DeviceQuery extends DeviceGQL {
  @Field(() => [EncryptedSecretQuery])
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    const lastSyncCondition = { gte: this.lastSyncAt ?? undefined }
    const { userId } = ctx.jwtPayload
    const res = await ctx.prisma.encryptedSecret.findMany({
      where: {
        OR: [
          {
            userId: userId,
            createdAt: lastSyncCondition
          },
          {
            userId: userId,
            updatedAt: lastSyncCondition
          }
        ]
      }
    })
    return res
  }

  @Field(() => String)
  async lastGeoLocation() {
    const geoIp = await getIpGeoLocation(this.lastIpAddress)
    return geoIp.city + ', ' + geoIp.country_name
  }
}

@ObjectType()
export class DeviceMutation extends DeviceGQLScalars {
  @Field(() => GraphQLISODateTime)
  async markAsSynced(@Ctx() ctx: IContext) {
    const syncedAt = new Date()
    const res = await ctx.prisma.device.update({
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
    @Ctx() ctx: IContext,
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
  async rename(@Ctx() ctx: IContext, @Arg('name') name: string) {
    return ctx.prisma.device.update({
      data: {
        name
      },
      where: {
        id: this.id
      }
    })
  }
}
