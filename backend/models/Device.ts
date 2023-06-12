import { GraphQLPositiveInt, GraphQLUUID } from 'graphql-scalars'
import {
  Field,
  GraphQLISODateTime,
  Ctx,
  ObjectType,
  Arg,
  InputType,
  Int
} from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/DeviceGQL'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEventGQL'
import { fetch } from 'undici'

import { GraphqlError } from '../api/GraphqlError'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { SettingsInput } from './models'

// TODO memoize this function into redis so that we don't hit the API limit
export async function getGeoIpLocation(ipAddress: string) {
  if (ipAddress === '127.0.0.1') {
    return {
      // Mock data from https://ipbase.com/
      data: {
        location: {
          city: {
            name: 'Brno'
          },
          country: {
            name: 'Czech Republic'
          }
        }
      }
    }
  }
  const res = await fetch(
    `https://api.ipbase.com/v2/info?ip=${ipAddress}&apikey=${process.env.FREE_GEOIP_API_KEY}`
  )

  if (res.status > 201) {
    console.warn('Failed to get geo location for ip', ipAddress)
  }
  const json: any = await res.json()

  return json
}

@InputType()
export class DeviceInput {
  @Field(() => String, { nullable: false })
  id: string

  @Field()
  name: string

  @Field({ nullable: false })
  platform: string
}

@ObjectType()
export class DeviceQuery extends DeviceGQL {
  async getIpGeoLocation(ipAddress: string) {
    const json = await getGeoIpLocation(ipAddress)
    if (!json.data) {
      return null
    }
    return {
      city: json.data.location.city.name,
      country_name: json.data.location.country.name
    }
  }

  @Field(() => [EncryptedSecretQuery], {
    description: 'Get all secrets that were change since last device sync'
  })
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    const lastSyncCondition = { gte: this.lastSyncAt ?? undefined }

    const userData = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.jwtPayload.userId
      }
    })

    if (userData) {
      const pswLimit = userData?.loginCredentialsLimit
      const totpLimit = userData?.TOTPlimit

      const pswCount = await ctx.prisma.encryptedSecret.count({
        where: {
          userId: ctx.jwtPayload.userId,
          kind: EncryptedSecretTypeGQL.LOGIN_CREDENTIALS,
          deletedAt: null
        }
      })

      const TOTPCount = await ctx.prisma.encryptedSecret.count({
        where: {
          userId: ctx.jwtPayload.userId,
          kind: EncryptedSecretTypeGQL.TOTP,
          deletedAt: null
        }
      })

      if (pswCount > pswLimit) {
        throw new GraphqlError(
          `Password limit exceeded, remove ${pswCount - pswLimit} passwords`
        )
      }

      if (TOTPCount > totpLimit) {
        throw new GraphqlError(
          `TOTP limit exceeded, remove ${TOTPCount - totpLimit} TOTP secrets`
        )
      }

      const kindOfSecret =
        ctx.device.syncTOTP === true
          ? undefined // returns all secrets
          : EncryptedSecretTypeGQL.LOGIN_CREDENTIALS // returns only login credentials

      const res = await ctx.prisma.encryptedSecret.findMany({
        where: {
          OR: [
            {
              userId: this.userId,
              kind: kindOfSecret,
              createdAt: lastSyncCondition
            },
            {
              userId: this.userId,
              kind: kindOfSecret,
              updatedAt: lastSyncCondition
            },
            {
              userId: this.userId,
              kind: kindOfSecret,
              deletedAt: lastSyncCondition
            }
          ]
        }
      })
      return res
    }
  }

  @Field(() => String)
  async lastGeoLocation() {
    const geoIp = await this.getIpGeoLocation(this.lastIpAddress)
    if (!geoIp) {
      return 'Unknown location'
    }
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
  async updateDeviceSettings(
    @Arg('syncTOTP', () => Boolean) syncTOTP: boolean,
    @Arg('vaultLockTimeoutSeconds', () => Int) vaultLockTimeoutSeconds: number,
    @Ctx() ctx: IContext
  ) {
    return await ctx.prisma.device.update({
      where: {
        id: this.id
      },
      data: {
        syncTOTP: syncTOTP,
        vaultLockTimeoutSeconds: vaultLockTimeoutSeconds
      }
    })
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
    if (this.id === ctx.masterDeviceId) {
      await ctx.prisma.decryptionChallenge.create({
        data: {
          deviceId: this.id,
          ipAddress: ctx.getIpAddress(),
          deviceName: this.name,
          userId: this.userId,
          approvedAt: new Date()
        }
      })
    }

    if (ctx.jwtPayload.deviceId === this.id) {
      ctx.reply.clearCookie('refresh-token')
      ctx.reply.clearCookie('access-token')
    }

    return await ctx.prisma.device.update({
      where: {
        id: this.id
      },
      data: { logoutAt: new Date(), firebaseToken: null }
    })
  }

  @Field(() => Boolean, {
    description: 'user has to approve it when they log in again on that device'
  })
  async removeDevice(@Ctx() ctx: IContextAuthenticated) {
    if (this.id === ctx.masterDeviceId) {
      throw new GraphqlError('You cannot remove master device from list.')
    }
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
