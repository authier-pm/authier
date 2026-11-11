import { hasCurrentDeviceApproval } from '../lib/newDeviceEmailApproval'
import {
  allowsDeviceApproval,
  allowsEmailApproval,
  isNewDeviceApprovalComplete
} from '../../shared/newDeviceApproval'
import { UserNewDevicePolicyGQL } from './types/UserNewDevicePolicy'
import { sendNewDeviceLoginPushNotifications } from '../lib/deviceLoginNotifications'
import { actOnReset, getResetStatus } from '../lib/masterDeviceReset'
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
class MasterDeviceResetStatus {
  @Field(() => Int) requiredApprovals: number
  @Field(() => Int) approvalCount: number
  @Field(() => GraphQLISODateTime) processAt: Date
  @Field(() => GraphQLISODateTime) expiresAt: Date
  @Field(() => GraphQLISODateTime, { nullable: true }) confirmedAt: Date | null
  @Field(() => GraphQLISODateTime, { nullable: true }) completedAt: Date | null
  @Field(() => GraphQLISODateTime, { nullable: true }) rejectedAt: Date | null
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

  @Field(() => MasterDeviceResetStatus, { nullable: true })
  async resetStatus(@Ctx() ctx: IContext) {
    return getResetStatus(ctx.db, this.id)
  }

  @Field(() => UserNewDevicePolicyGQL)
  approvalPolicy: UserNewDevicePolicyGQL

  @Field(() => GraphQLISODateTime, { nullable: true })
  emailApprovalSentAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  emailApprovedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  deviceApprovedAt: Date | null

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
      // Serialize enrollment-secret rotation across challenges for this user.
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .for('update')

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
      if (!(await hasCurrentDeviceApproval(tx, challenge, userData))) {
        throw new GraphqlError('Login failed')
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

      const isNewDevice = !deviceRec
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
            passkeyCreationVerificationRequired:
              defaultSettings.passkeyCreationVerificationRequired,
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

      return { userData, deviceRec, isNewDevice }
    })
    const { userData, deviceRec, isNewDevice } = result

    // Email approval does not send a device approval request. Notify enrolled
    // devices after the new device proves the master password and commits.
    if (isNewDevice && allowsEmailApproval(userData.newDevicePolicy)) {
      const recipients = await ctx.db.query.device.findMany({
        where: {
          userId,
          logoutAt: { isNull: true },
          deletedAt: { isNull: true }
        },
        columns: { id: true, firebaseToken: true }
      })
      const tokens = recipients
        .filter((recipient) => recipient.id !== deviceRec.id)
        .map((recipient) => recipient.firebaseToken)
        .filter((token): token is string => Boolean(token))
      await sendNewDeviceLoginPushNotifications(
        [...new Set(tokens)],
        `${deviceRec.name} signed in to your Authier account.`
      )
    }

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
    return ctx.db.transaction(async (tx) => {
      const [userData] = await tx
        .select()
        .from(user)
        .where(eq(user.id, ctx.jwtPayload.userId))
        .for('update')
      if (!userData) throw new GraphqlError('User not found')
      const reset = await tx.query.masterDeviceResetRequest.findFirst({
        where: {
          decryptionChallengeId: this.id,
          userId: userData.id,
          completedAt: { isNull: true },
          rejectedAt: { isNull: true }
        },
        columns: { id: true }
      })
      if (reset)
        throw new GraphqlError(
          'Use the explicit master device reset approval action'
        )
      if (!allowsDeviceApproval(userData.newDevicePolicy)) {
        throw new GraphqlError('Approval from another device is not enabled')
      }
      const approvingDevice = await tx.query.device.findFirst({
        where: {
          id: ctx.device.id,
          userId: userData.id,
          deletedAt: { isNull: true },
          logoutAt: { isNull: true }
        }
      })
      if (!approvingDevice) throw new GraphqlError('Device is not active')
      const [challenge] = await tx
        .select()
        .from(decryptionChallenge)
        .where(
          and(
            eq(decryptionChallenge.id, this.id),
            eq(decryptionChallenge.userId, userData.id)
          )
        )
        .for('update')
      if (
        !challenge ||
        challenge.rejectedAt ||
        challenge.blockIp ||
        challenge.deviceId === approvingDevice.id
      ) {
        throw new GraphqlError('Login approval is unavailable')
      }
      const requestedDevice = await tx.query.device.findFirst({
        where: { id: challenge.deviceId }
      })
      if (requestedDevice && requestedDevice.userId !== userData.id) {
        throw new GraphqlError('Login approval is unavailable')
      }
      const now = new Date()
      const complete = isNewDeviceApprovalComplete(userData.newDevicePolicy, {
        emailApproved: Boolean(challenge.emailApprovedAt),
        deviceApproved: true
      })
      const [approved] = await tx
        .update(decryptionChallenge)
        .set({
          deviceApprovedAt: challenge.deviceApprovedAt ?? now,
          approvedAt: complete ? (challenge.approvedAt ?? now) : null,
          approvedFromDeviceId: approvingDevice.id,
          ...(complete
            ? { emailApprovalTokenHash: null, emailApprovalExpiresAt: null }
            : {})
        })
        .where(eq(decryptionChallenge.id, challenge.id))
        .returning()
      return approved
    })
  }

  @Field(() => DecryptionChallengeGQL)
  async approveMasterDeviceReset(@Ctx() ctx: IContextAuthenticated) {
    const challenge = await actOnReset(ctx, this.id, 'approve')
    if (!challenge) throw new GraphqlError('No pending master device reset')
    return challenge
  }

  @Field(() => DecryptionChallengeGQL)
  async reject(@Ctx() ctx: IContextAuthenticated) {
    const reset = await actOnReset(ctx, this.id, 'reject')
    if (reset) return reset

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
        approvedAt: null,
        emailApprovalTokenHash: null,
        emailApprovalExpiresAt: null,
        emailApprovedAt: null,
        deviceApprovedAt: null
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
