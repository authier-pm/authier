import { hashDeviceSecret, verifyDeviceSecret } from '../utils/deviceSecretHash'
import 'reflect-metadata'
import {
  Arg,
  Ctx,
  Field,
  ID,
  Int,
  ObjectType,
  GraphQLISODateTime
} from 'type-graphql'
import type { IContext, IContextAuthenticated } from './types/ContextTypes'
import { DecryptionChallengeGQL } from './generated/DecryptionChallengeGQL'

import { createUnionType } from 'type-graphql'
import { GraphQLJSON, GraphQLNonEmptyString } from 'graphql-scalars'
import { GraphqlError } from '../lib/GraphqlError'

import { AddNewDeviceInput } from './AuthInputs'
import { LoginResponse } from './models'
import { UserMutation } from './UserMutation'
import { getGeoIpLocation } from '../lib/getGeoIpLocation'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'
import {
  user,
  decryptionChallenge,
  device,
  masterDeviceResetRequest
} from '../drizzle/schema'
import { eq, and, isNull } from 'drizzle-orm'

@ObjectType()
class DeviceLocation {
  @Field(() => String, { nullable: false })
  city: string

  @Field(() => String, { nullable: false })
  countryName: string
}

@ObjectType()
export class DecryptionChallengeForApproval {
  @Field(() => GraphQLJSON, { nullable: true })
  async ipGeoLocation() {
    // TODO remove in favor of deviceLocationFromIp
    const json = await getGeoIpLocation.memoized(this.ipAddress)

    return json
  }

  @Field(() => DeviceLocation, { nullable: true })
  async deviceLocationFromIp() {
    const json = await getGeoIpLocation.memoized(this.ipAddress)

    return json
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  ipAddress: string

  @Field(() => GraphQLISODateTime, { nullable: true })
  rejectedAt?: Date

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => String)
  deviceName: string

  @Field(() => ID)
  deviceId: string

  @Field(() => Int)
  pushNotificationsSentCount: number

  @Field(() => Int)
  pushNotificationsFailedCount: number

  @Field(() => GraphQLISODateTime, { nullable: true })
  masterDeviceResetRequestedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  masterDeviceResetProcessAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  masterDeviceResetConfirmedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  masterDeviceResetRejectedAt: Date | null
}

@ObjectType()
export class DecryptionChallengeApproved extends DecryptionChallengeGQL {
  @Field(() => String)
  addDeviceSecretEncrypted: string

  @Field(() => String)
  encryptionSalt: string

  @Field(() => LoginResponse)
  async addNewDeviceForUser(
    @Arg('input', () => AddNewDeviceInput) input: AddNewDeviceInput,
    @Arg('currentAddDeviceSecret', () => GraphQLNonEmptyString)
    currentAddDeviceSecret: string,
    @Ctx() ctx: IContext
  ) {
    const { id, deviceId, userId } = this

    // Re-read persisted approval under a row lock; resolver objects may be stale
    // or constructed directly by another transport.
    const result = await ctx.db.transaction(async (tx) => {
      const [challenge] = await tx
        .select()
        .from(decryptionChallenge)
        .where(
          and(
            eq(decryptionChallenge.id, id),
            eq(decryptionChallenge.deviceId, deviceId),
            eq(decryptionChallenge.userId, userId)
          )
        )
        .for('update')
      if (!challenge?.approvedAt || challenge.rejectedAt || challenge.blockIp) {
        throw new GraphqlError('Login failed')
      }
      // Serialize enrollment-secret rotation across challenges for this user.
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .for('update')

      const userData = await tx.query.user.findFirst({
        where: { id: userId },
        with: {
          encryptedSecrets: true,
          defaultSettings: true
        }
      })

      if (!userData) {
        throw new GraphqlError('User not found')
      }

      if (
        !(await verifyDeviceSecret(
          currentAddDeviceSecret,
          userData.addDeviceSecret
        ))
      ) {
        throw new GraphqlError('Wrong master password used')
      }

      await tx
        .update(user)
        .set({
          addDeviceSecret: await hashDeviceSecret(input.addDeviceSecret),
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
        })
        .where(eq(user.id, userData.id))

      await tx
        .update(decryptionChallenge)
        .set({
          masterPasswordVerifiedAt: new Date()
        })
        .where(
          and(
            id != null ? eq(decryptionChallenge.id, id) : undefined,
            eq(decryptionChallenge.deviceId, deviceId),
            eq(decryptionChallenge.userId, userData.id)
          )
        )

      const { firebaseToken } = input
      const ipAddress = ctx.getIpAddress()

      let deviceRec = await tx.query.device.findFirst({
        where: { id: deviceId }
      })

      const defaultSettings =
        userData.defaultSettings ?? defaultDeviceSettingSystemValues

      if (deviceRec) {
        if (deviceRec.userId !== userData.id) {
          const deviceOwner = await tx.query.user.findFirst({
            where: { id: deviceRec!.userId }
          })
          if (!deviceOwner) throw new Error('Device owner not found')
          throw new GraphqlError(
            `Device is already registered with user ${deviceOwner.email}`
          )
        }

        const res = await tx
          .update(device)
          .set({
            logoutAt: null,
            firebaseToken
          })
          .where(eq(device.id, deviceRec.id))
          .returning()
        deviceRec = res[0]!
      } else {
        const res = await tx
          .insert(device)
          .values({
            id: deviceId,
            firstIpAddress: ipAddress,
            lastIpAddress: ipAddress,
            firebaseToken: firebaseToken,
            name: this.deviceName,
            userId: userData.id,
            platform: input.devicePlatform,
            syncTOTP: defaultSettings.syncTOTP,
            autofillTOTPEnabled: defaultSettings.autofillTOTPEnabled,
            vaultLockTimeoutSeconds: defaultSettings.vaultLockTimeoutSeconds
          })
          .returning()
        deviceRec = res[0]!
      }

      if (!userData.masterDeviceId) {
        await tx
          .update(user)
          .set({
            masterDeviceId: deviceRec.id
          })
          .where(eq(user.id, userData.id))
        userData.masterDeviceId = deviceRec.id
      }

      return { userData, deviceRec }
    })
    const { userData, deviceRec } = result

    return new UserMutation(userData).setCookiesAndConstructLoginResponse(
      deviceRec,
      ctx
    )
  }
}

@ObjectType()
export class MasterDeviceResetRequestResult {
  @Field(() => GraphQLISODateTime)
  requestedAt: Date

  @Field(() => GraphQLISODateTime)
  processAt: Date

  @Field(() => Boolean)
  alreadyPending: boolean
}

@ObjectType()
export class DecryptionChallengeMutation extends DecryptionChallengeGQL {
  @Field(() => DecryptionChallengeGQL)
  async approve(@Ctx() ctx: IContextAuthenticated) {
    const userData = await ctx.db.query.user.findFirst({
      where: { id: ctx.jwtPayload.userId },
      columns: {
        newDevicePolicy: true,
        masterDeviceId: true
      }
    })

    if (!userData) throw new Error('User not found')

    if (
      userData.newDevicePolicy === 'REQUIRE_MASTER_DEVICE_APPROVAL' &&
      userData.masterDeviceId !== ctx.device.id
    ) {
      throw new GraphqlError(
        'Only the master device can approve a decryption challenge'
      )
    }

    const res = await ctx.db
      .update(decryptionChallenge)
      .set({
        approvedAt: new Date(),
        approvedFromDeviceId: ctx.device.id,
        rejectedAt: null,
        blockIp: this.blockIp ? false : null
      })
      .where(eq(decryptionChallenge.id, this.id))
      .returning()
    return res[0]!
  }

  @Field(() => DecryptionChallengeGQL)
  async reject(@Ctx() ctx: IContextAuthenticated) {
    const rejectingUser = await ctx.db.query.user.findFirst({
      where: { id: this.userId },
      columns: {
        masterDeviceId: true
      }
    })

    const res = await ctx.db
      .update(decryptionChallenge)
      .set({
        rejectedAt: new Date(),
        blockIp: true,
        approvedAt: null
      })
      .where(eq(decryptionChallenge.id, this.id))
      .returning()

    if (rejectingUser?.masterDeviceId === ctx.device.id) {
      await ctx.db
        .update(masterDeviceResetRequest)
        .set({
          rejectedAt: new Date()
        })
        .where(
          and(
            eq(masterDeviceResetRequest.decryptionChallengeId, this.id),
            isNull(masterDeviceResetRequest.completedAt),
            isNull(masterDeviceResetRequest.rejectedAt)
          )
        )
    }

    return res[0]!
  }

  @Field(() => DecryptionChallengeGQL)
  async recoverAccount(@Ctx() ctx: IContextAuthenticated) {
    const res = await ctx.db
      .update(user)
      .set({
        recoveryDecryptionChallengeId: this.id
      })
      .where(eq(user.id, this.userId))
      .returning()
    return res[0]!
  }
}

export const DecryptionChallengeUnion = createUnionType({
  name: 'DecryptionChallenge', // the name of the GraphQL union
  types: () =>
    [DecryptionChallengeApproved, DecryptionChallengeForApproval] as const
})
