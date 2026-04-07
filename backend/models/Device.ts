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
import type { IContext, IContextAuthenticated } from './types/ContextTypes'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/DeviceGQL'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEventGQL'

import { GraphqlError } from '../lib/GraphqlError'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'

import { getGeoIpLocation } from '../lib/getGeoIpLocation'
import {
  user,
  encryptedSecret,
  device,
  decryptionChallenge,
  secretUsageEvent
} from '../drizzle/schema'
import { eq, and, or, isNull, gte, count, sql } from 'drizzle-orm'

@InputType()
export class DeviceInput {
  @Field(() => String, { nullable: false })
  id: string

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: false })
  platform: string
}

export const getEncryptedSecretsToSync = async (
  ctx: Pick<IContextAuthenticated, 'db' | 'device' | 'jwtPayload'>,
  deviceState: {
    lastSyncAt: Date | null
    userId: string
  }
) => {
  const userData = await ctx.db.query.user.findFirst({
    where: { id: ctx.jwtPayload.userId }
  })

  if (!userData) {
    return []
  }

  const pswLimit = userData.loginCredentialsLimit
  const totpLimit = userData.TOTPlimit

  const [{ count: pswCount }] = await ctx.db
    .select({ count: count() })
    .from(encryptedSecret)
    .where(
      and(
        eq(encryptedSecret.userId, ctx.jwtPayload.userId),
        eq(encryptedSecret.kind, EncryptedSecretTypeGQL.LOGIN_CREDENTIALS),
        isNull(encryptedSecret.deletedAt)
      )
    )

  const [{ count: TOTPCount }] = await ctx.db
    .select({ count: count() })
    .from(encryptedSecret)
    .where(
      and(
        eq(encryptedSecret.userId, ctx.jwtPayload.userId),
        eq(encryptedSecret.kind, EncryptedSecretTypeGQL.TOTP),
        isNull(encryptedSecret.deletedAt)
      )
    )

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

  const kindCondition =
    ctx.device.syncTOTP === true
      ? undefined
      : eq(encryptedSecret.kind, EncryptedSecretTypeGQL.LOGIN_CREDENTIALS)

  const cAtCondition = deviceState.lastSyncAt
    ? gte(encryptedSecret.createdAt, deviceState.lastSyncAt)
    : undefined
  const uAtCondition = deviceState.lastSyncAt
    ? gte(encryptedSecret.updatedAt, deviceState.lastSyncAt)
    : undefined
  const dAtCondition = deviceState.lastSyncAt
    ? gte(encryptedSecret.deletedAt, deviceState.lastSyncAt)
    : undefined

  const orConditions = [cAtCondition, uAtCondition, dAtCondition].filter(
    (condition): condition is NonNullable<typeof condition> =>
      condition !== undefined
  )

  return ctx.db
    .select()
    .from(encryptedSecret)
    .where(
      and(
        eq(encryptedSecret.userId, deviceState.userId),
        kindCondition,
        orConditions.length > 0 ? or(...orConditions) : undefined
      )
    )
}

@ObjectType()
export class DeviceQuery extends DeviceGQL {
  @Field(() => [EncryptedSecretQuery], {
    description: 'Get all secrets that were change since last device sync'
  })
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    return getEncryptedSecretsToSync(ctx, {
      lastSyncAt: this.lastSyncAt,
      userId: this.userId
    })
  }

  @Field(() => String)
  async lastGeoLocation() {
    const geoIp = await getGeoIpLocation.memoized(this.lastIpAddress)
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
    const [syncedDevice] = await ctx.db
      .update(device)
      .set({
        lastSyncAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(device.id, this.id))
      .returning({
        lastSyncAt: device.lastSyncAt
      })

    if (!syncedDevice?.lastSyncAt) {
      throw new GraphqlError('Device not found')
    }

    return syncedDevice.lastSyncAt
  }

  @Field(() => SecretUsageEventGQLScalars)
  async reportSecretUsageEvent(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('kind', () => String) kind: string,
    @Arg('secretId', () => GraphQLUUID) secretId: string,
    @Arg('webInputId', () => GraphQLPositiveInt, {
      nullable: true,
      description: 'null when user has copied it using a button'
    })
    webInputId: number
  ) {
    const res = await ctx.db
      .insert(secretUsageEvent)
      .values({
        ipAddress: ctx.getIpAddress(),
        kind,
        timestamp: new Date(),
        secretId,
        userId: this.userId,
        deviceId: this.id,
        webInputId
      })
      .returning()
    return res[0]
  }

  @Field(() => DeviceGQL)
  async updateDeviceSettings(
    @Arg('syncTOTP', () => Boolean) syncTOTP: boolean,
    @Arg('vaultLockTimeoutSeconds', () => Int) vaultLockTimeoutSeconds: number,
    @Ctx() ctx: IContext
  ) {
    const res = await ctx.db
      .update(device)
      .set({
        syncTOTP: syncTOTP,
        vaultLockTimeoutSeconds: vaultLockTimeoutSeconds
      })
      .where(eq(device.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => DeviceGQL)
  async rename(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('name', () => String) name: string
  ) {
    const res = await ctx.db
      .update(device)
      .set({
        name
      })
      .where(eq(device.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => DeviceGQL)
  async logout(@Ctx() ctx: IContextAuthenticated) {
    if (this.id === ctx.masterDeviceId) {
      await ctx.db.insert(decryptionChallenge).values({
        deviceId: this.id,
        ipAddress: ctx.getIpAddress(),
        deviceName: this.name,
        userId: this.userId,
        approvedAt: new Date()
      })
    }

    if (ctx.jwtPayload.deviceId === this.id) {
      ctx.reply.clearCookie('refresh-token')
      ctx.reply.clearCookie('access-token')
    }

    const res = await ctx.db
      .update(device)
      .set({
        logoutAt: new Date(),
        firebaseToken: null
      })
      .where(eq(device.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => Boolean, {
    description: 'user has to approve it when they log in again on that device'
  })
  async removeDevice(@Ctx() ctx: IContextAuthenticated) {
    if (this.id === ctx.masterDeviceId) {
      throw new GraphqlError('You cannot remove master device from list.')
    }
    await this.logout(ctx)

    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(decryptionChallenge)
        .where(eq(decryptionChallenge.deviceId, this.id))
      await tx.delete(device).where(eq(device.id, this.id))
    })

    return true
  }
}
