import 'reflect-metadata'
import { Arg, Ctx, Field, ID, Int, ObjectType } from 'type-graphql'
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
import { UserNewDevicePolicy } from '@prisma/client'

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

  @Field()
  ipAddress: string

  @Field({ nullable: true })
  rejectedAt?: Date

  @Field()
  createdAt: Date

  @Field()
  deviceName: string

  @Field(() => ID)
  deviceId: string
}

@ObjectType()
export class DecryptionChallengeApproved extends DecryptionChallengeGQL {
  @Field()
  addDeviceSecretEncrypted: string

  @Field()
  encryptionSalt: string

  @Field(() => LoginResponse)
  async addNewDeviceForUser(
    @Arg('input', () => AddNewDeviceInput) input: AddNewDeviceInput,
    @Arg('currentAddDeviceSecret', () => GraphQLNonEmptyString)
    currentAddDeviceSecret: string,
    @Ctx() ctx: IContext
  ) {
    const { id, deviceId, userId } = this

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        EncryptedSecrets: true,
        DefaultDeviceSettings: true
      }
    })

    if (!user) {
      throw new GraphqlError('User not found')
    }

    if (user?.addDeviceSecret !== currentAddDeviceSecret) {
      // TODO rate limit these attempts and notify current devices
      throw new GraphqlError('Wrong master password used')
    }

    await ctx.prisma.user.update({
      data: {
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
      },
      where: {
        id: user.id
      }
    })

    await ctx.prisma.decryptionChallenge.updateMany({
      where: {
        id,
        deviceId,
        userId: user.id
      },
      data: { masterPasswordVerifiedAt: new Date() }
    })

    const { firebaseToken } = input
    const ipAddress = ctx.getIpAddress()

    let device = await ctx.prisma.device.findUnique({
      where: { id: deviceId }
    })

    const defaultSettings =
      user.DefaultDeviceSettings ?? defaultDeviceSettingSystemValues

    if (device) {
      if (device.userId !== user.id) {
        const deviceOwner = await ctx.prisma.user.findUniqueOrThrow({
          where: { id: device.userId }
        })
        throw new GraphqlError(
          `Device is already registered with user ${deviceOwner.email}`
        ) // prevents users from circumventing our limits by using multiple accounts
      }

      device = await ctx.prisma.device.update({
        data: { logoutAt: null, firebaseToken },
        where: { id: device.id }
      })
    } else {
      device = await ctx.prisma.device.create({
        data: {
          id: deviceId,
          firstIpAddress: ipAddress,
          lastIpAddress: ipAddress,
          firebaseToken: firebaseToken,
          name: this.deviceName,
          userId: user.id,
          platform: input.devicePlatform,
          syncTOTP: defaultSettings.syncTOTP,
          autofillCredentialsEnabled:
            defaultSettings.autofillCredentialsEnabled,
          autofillTOTPEnabled: defaultSettings.autofillTOTPEnabled,
          vaultLockTimeoutSeconds: defaultSettings.vaultLockTimeoutSeconds
        }
      })
    }

    return new UserMutation(user).setCookiesAndConstructLoginResponse(
      device,
      ctx
    )
  }
}

@ObjectType()
export class DecryptionChallengeMutation extends DecryptionChallengeGQL {
  @Field(() => DecryptionChallengeGQL)
  async approve(@Ctx() ctx: IContextAuthenticated) {
    const user = await ctx.prisma.user.findFirstOrThrow({
      where: {
        id: ctx.jwtPayload.userId
      },
      select: {
        newDevicePolicy: true,
        masterDeviceId: true
      }
    })

    if (
      user?.newDevicePolicy ===
        UserNewDevicePolicy.REQUIRE_MASTER_DEVICE_APPROVAL &&
      user?.masterDeviceId !== ctx.device.id
    ) {
      throw new GraphqlError(
        'Only the master device can approve a decryption challenge'
      )
    }

    return ctx.prisma.decryptionChallenge.update({
      where: { id: this.id },
      data: {
        approvedAt: new Date(),
        approvedFromDeviceId: ctx.device.id,
        rejectedAt: null,
        blockIp: this.blockIp ? false : null // if it was previously rejected, we mark it as false
      }
    })
  }

  @Field(() => DecryptionChallengeGQL)
  async reject(@Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.decryptionChallenge.update({
      where: { id: this.id },
      data: { rejectedAt: new Date(), blockIp: true, approvedAt: null }
    })
  }

  @Field(() => DecryptionChallengeGQL)
  async recoverAccount(@Ctx() ctx: IContextAuthenticated) {
    // TODO send notification to all contacts we have, just email for now
    return ctx.prisma.user.update({
      where: { id: this.userId },
      data: { recoveryDecryptionChallengeId: this.id } // rest is handled by our CRON job
    })
  }
}

export const DecryptionChallengeUnion = createUnionType({
  name: 'DecryptionChallenge', // the name of the GraphQL union
  types: () =>
    [DecryptionChallengeApproved, DecryptionChallengeForApproval] as const
})
