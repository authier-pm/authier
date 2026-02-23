import { db } from '../prisma/prismaClient'
import {
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  GraphQLISODateTime
} from 'type-graphql'
import type { IContext, IContextAuthenticated } from './types/ContextTypes'

import { EncryptedSecretQuery } from './EncryptedSecret'

import { GraphQLEmailAddress } from 'graphql-scalars'
import { UserGQL } from './generated/UserGQL'

import { setNewAccessTokenIntoCookie, setNewRefreshToken } from '../userAuth'
import { DeviceQuery } from './Device'
import { EmailVerificationGQLScalars } from './generated/EmailVerificationGQL'
import type { InferSelectModel } from 'drizzle-orm'
type Device = InferSelectModel<typeof deviceSchema>
import { DecryptionChallengeForApproval } from './DecryptionChallenge'
import { defaultDeviceSettingUserValuesWithId } from './defaultDeviceSettingSystemValues'
import { DefaultDeviceSettingsQuery } from './DefaultDeviceSettings'
import { firebaseSendNotification } from '../lib/firebaseAdmin'
import { eq, max, and, isNull, count } from 'drizzle-orm'
import { encryptedSecret, device as deviceSchema } from '../drizzle/schema'

@ObjectType()
export class UserBase extends UserGQL {
  constructor(parameters: Record<string, unknown>) {
    super()
    Object.assign(this, parameters)
    addUserGraphqlAliases(this)
  }

  @Field(() => GraphQLEmailAddress, {
    nullable: true
  })
  declare email: string

  async setCookiesAndConstructLoginResponse(device: Device, ctx: IContext) {
    const userDevice = await ctx.db.query.device.findFirst({
      where: { userId: this.id, id: device.id }
    })

    if (!userDevice) throw new Error('Device not found')

    setNewRefreshToken(this, userDevice, ctx)

    const accessToken = setNewAccessTokenIntoCookie(this, userDevice, ctx)

    return {
      accessToken,
      user: {
        ...this,
        //Remove deleted items
        EncryptedSecrets:
          this.EncryptedSecrets?.length > 0
            ? this.EncryptedSecrets.filter(({ deletedAt }) => !deletedAt)
            : []
      }
    }
  }

  async defaultDeviceSettings(@Ctx() ctx: IContext) {
    const deviceDefaultSettings = await ctx.db.query.defaultSettings.findFirst({
      where: { userId: this.id }
    })

    return deviceDefaultSettings ?? defaultDeviceSettingUserValuesWithId
  }
}

type UserTotpLimitShape = {
  TOTPlimit?: number | null
}

// HOTFIX todo refactor
const userRelationAliases = {
  defaultSettings: 'DefaultDeviceSettings',
  devicesUserId: 'Devices',
  encryptedSecrets: 'EncryptedSecrets',
  masterDeviceChanges: 'MasterDeviceChange',
  secretUsageEvents: 'UsageEvents',
  tags: 'Tags',
  tokens: 'Token',
  userPaidProducts: 'UserPaidProducts',
  webInputs: 'WebInputsAdded'
} as const

export function addUserGraphqlAliases<T extends UserTotpLimitShape>(
  user: T
): T {
  const userRecord = user as T & Record<string, unknown>

  for (const [drizzleKey, graphQlKey] of Object.entries(userRelationAliases)) {
    if (
      userRecord[graphQlKey] == null &&
      userRecord[drizzleKey] !== undefined
    ) {
      // @ts-expect-error
      userRecord[graphQlKey] = userRecord[drizzleKey]
    }
  }

  return user
}

@ObjectType()
export class UserQuery extends UserBase {
  @Field(() => [DeviceQuery])
  async devices(@Ctx() ctx: IContext) {
    return ctx.db.query.device.findMany({
      where: { userId: this.id },
      orderBy: (d, { desc }) => [desc(d.lastSyncAt), desc(d.createdAt)]
    })
  }

  @Field(() => DefaultDeviceSettingsQuery)
  async defaultDeviceSettings(@Ctx() ctx: IContext) {
    return super.defaultDeviceSettings(ctx)
  }

  @Field(() => DeviceQuery)
  async device(@Ctx() ctx: IContext, @Arg('id', () => String) id: string) {
    return ctx.db.query.device.findFirst({
      where: { userId: this.id, id: id }
    })
  }

  @Field(() => GraphQLISODateTime, { nullable: true })
  async lastChangeInSecrets(@Ctx() ctx: IContext) {
    const res = await ctx.db
      .select({
        updatedAt: max(encryptedSecret.updatedAt),
        createdAt: max(encryptedSecret.createdAt)
      })
      .from(encryptedSecret)
      .where(eq(encryptedSecret.userId, this.id))

    if (!res[0]) return null
    return new Date(
      Math.max(Number(res[0].createdAt), Number(res[0].updatedAt))
    )
  }

  @Field(() => Int)
  async devicesCount(@Ctx() ctx: IContext) {
    const res = await ctx.db
      .select({ count: count() })
      .from(deviceSchema)
      .where(
        and(eq(deviceSchema.userId, this.id), isNull(deviceSchema.deletedAt))
      )
    return res[0]?.count ?? 0
  }

  @Field(() => EmailVerificationGQLScalars, { nullable: true })
  async primaryEmailVerification(@Ctx() ctx: IContext) {
    const res = await ctx.db.query.emailVerification.findFirst({
      where: {
        userId: this.id,
        address: this.email,
        kind: 'PRIMARY'
      }
    })
    return res
  }
  @Field(() => [EmailVerificationGQLScalars])
  async emailVerifications(@Ctx() ctx: IContext) {
    return ctx.db.query.emailVerification.findMany({
      where: { userId: this.id }
    })
  }

  @Field(() => [EncryptedSecretQuery])
  async encryptedSecrets(@Ctx() ctx: IContext) {
    return ctx.db.query.encryptedSecret.findMany({
      where: {
        userId: this.id,
        deletedAt: { isNull: true } // check if this works for isNull
      }
    })
  }

  // TODO use this to send notifications to the master device about unlock and wrong password attempts
  async sendAuthMessage(
    deviceId: string,
    title: string,
    body: string,
    type: string
  ) {
    console.log('NOTIFICATION')
    const user = await db.query.user.findFirst({
      where: {
        id: this.id
      },
      with: {
        devicesUserId: true
      }
    })

    if (!user || deviceId === user.masterDeviceId) {
      console.log('no user or master device or firebase token')
      return false // no point in sending messages to the master device
    }

    const masterDevice = await db.query.device.findFirst({
      where: { id: user.masterDeviceId! }
    })

    if (!masterDevice?.firebaseToken || masterDevice.firebaseToken.length < 8) {
      console.log('no firebase token')
      return false // no point in sending messages to the master deviceId
    }

    try {
      await firebaseSendNotification({
        token: masterDevice.firebaseToken,
        notification: {
          title: title,
          body:
            user.devicesUserId.find(({ id }) => id === deviceId)?.name + body
        },
        data: {
          type: type
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  @Field(() => [DecryptionChallengeForApproval])
  async decryptionChallengesWaiting(@Ctx() ctx: IContextAuthenticated) {
    return ctx.db.query.decryptionChallenge.findMany({
      where: {
        userId: ctx.jwtPayload.userId,
        approvedAt: { isNull: true },
        rejectedAt: { isNull: true }
      }
    })
  }
}
