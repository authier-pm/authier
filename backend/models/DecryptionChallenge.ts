import 'reflect-metadata'
import { Arg, Ctx, Field, ID, Info, Int, ObjectType } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { DecryptionChallengeGQL } from './generated/DecryptionChallengeGQL'
import { GraphQLResolveInfo } from 'graphql'
import { createUnionType } from 'type-graphql'
import { GraphQLJSON, GraphQLNonEmptyString } from 'graphql-scalars'
import { GraphqlError } from '../lib/GraphqlError'

import { AddNewDeviceInput } from './AuthInputs'
import { LoginResponse } from './models'
import { UserMutation } from './UserMutation'
import { getGeoIpLocation } from './Device'

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
    const json = await getGeoIpLocation(this.ipAddress)
    if (!json.data) {
      return null
    }
    return {
      city: json.data.location.city.name,
      country_name: json.data.location.country.name
    }
  }

  @Field(() => DeviceLocation, { nullable: true })
  async deviceLocationFromIp() {
    const json = await getGeoIpLocation(this.ipAddress)
    if (!json.data) {
      return null
    }
    return {
      city: json.data.location.city.name,
      countryName: json.data.location.country.name
    }
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
    @Ctx() ctx: IContext,
    @Info() info: GraphQLResolveInfo
  ) {
    const { id, deviceId, userId } = this

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        EncryptedSecrets: true
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
      // TODO change this to upsert
      where: { id: deviceId }
    })

    if (device) {
      if (device.userId !== user.id) {
        throw new GraphqlError('Device is already registered for another user') // prevents users from circumventing our limits by using multiple accounts
      }

      device = await ctx.prisma.device.update({
        data: { logoutAt: null, firebaseToken },
        where: { id: device.id }
      })
    } else {
      device = await ctx.prisma.device.create({
        data: {
          id: deviceId,
          syncTOTP: user.defaultDeviceSyncTOTP,
          firstIpAddress: ipAddress,
          lastIpAddress: ipAddress,
          firebaseToken: firebaseToken,
          name: this.deviceName,
          userId: user.id,
          platform: input.devicePlatform
        }
      })
    }

    return new UserMutation(user).setCookiesAndConstructLoginResponse(
      device.id,
      ctx
    )
  }
}

@ObjectType()
export class DecryptionChallengeMutation extends DecryptionChallengeGQL {
  @Field(() => DecryptionChallengeGQL)
  async approve(@Ctx() ctx: IContextAuthenticated) {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.jwtPayload.userId
      }
    })

    if (user?.masterDeviceId !== ctx.device.id) {
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
