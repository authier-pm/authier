import { throwIfNotAuthenticated } from '../lib/authMiddleware'
import {
  Query,
  Resolver,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
  Info,
  Int
} from 'type-graphql'
import { LoginResponse } from '../models/models'

import { verify } from 'jsonwebtoken'
import { addUserGraphqlAliases, UserQuery } from '../models/UserQuery'
import { UserMutation } from '../models/UserMutation'
import { constructURL } from '../../shared/urlUtils'

import { GraphqlError } from '../lib/GraphqlError'
import { WebInputElement } from '../models/WebInputElement'
import {
  GraphQLEmailAddress,
  GraphQLPositiveInt,
  GraphQLUUID
} from 'graphql-scalars'

import debug from 'debug'
import { RegisterNewAccountInput } from '../models/AuthInputs'

import {
  WebInputGQL,
  WebInputGQLScalars
} from '../models/generated/WebInputGQL'

import type { GraphQLResolveInfo } from 'graphql'

import { DeviceInput, DeviceMutation, DeviceQuery } from '../models/Device'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeForApproval,
  DecryptionChallengeUnion,
  MasterDeviceResetRequestResult
} from '../models/DecryptionChallenge'
import { plainToClass } from 'class-transformer'

import { firebaseSendNotification } from '../lib/firebaseAdmin'
import { getGeoIpLocation } from '../lib/getGeoIpLocation'
import { sendEmail } from '../utils/email'
import { WebInputMutation } from '../models/WebInput'
import type {
  IContext,
  IContextAuthenticated
} from '../models/types/ContextTypes'
import { eq, and, or, like, sql, gte, count, isNull, desc } from 'drizzle-orm'
import * as schema from '../drizzle/schema'

const log = debug('au:RootResolver')

type PushDeliveryCounts = {
  pushNotificationsSentCount: number
  pushNotificationsFailedCount: number
}

const sendNewDeviceLoginPushNotifications = async (
  firebaseTokens: string[],
  notificationBody: string
): Promise<PushDeliveryCounts> => {
  const results = await Promise.allSettled(
    firebaseTokens.map((firebaseToken) => {
      log('sending notification to', firebaseToken)

      return firebaseSendNotification({
        token: firebaseToken,
        notification: {
          title: 'New device login!',
          body: notificationBody
        },
        data: {
          type: 'Devices'
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              priority: 10
            }
          }
        }
      })
    })
  )

  let pushNotificationsSentCount = 0
  let pushNotificationsFailedCount = 0

  for (const result of results) {
    if (result.status === 'rejected') {
      pushNotificationsFailedCount += 1
      continue
    }

    if (result.value.ok) {
      pushNotificationsSentCount += 1
    } else {
      pushNotificationsFailedCount += 1
    }
  }

  return {
    pushNotificationsSentCount,
    pushNotificationsFailedCount
  }
}

@Resolver()
export class RootResolver {
  @Query(() => String)
  osTime() {
    return new Date().toISOString()
  }

  @Query(() => Boolean, {
    description: 'you need to be authenticated to call this resolver'
  })
  authenticated(@Ctx() ctx: IContext) {
    const inCookies = ctx.request.cookies['access-token']
    const inHeader = ctx.request.headers['authorization']

    try {
      if (inHeader) {
        const token = inHeader?.split(' ')[1]
        verify(token, process.env.ACCESS_TOKEN_SECRET!)
        return true
      } else if (inCookies) {
        verify(inCookies, process.env.ACCESS_TOKEN_SECRET!)
        return true
      }

      return false
    } catch (err) {
      return false
    }
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => UserQuery)
  @Mutation(() => UserMutation, {
    description: 'you need to be authenticated to call this resolver',
    name: 'me',
    nullable: false
  })
  async me(
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = ctx

    const tmp = await ctx.db.query.user.findFirst({
      where: { id: jwtPayload.userId },
      with: {
        encryptedSecrets: true,
        devicesUserId: true,
        defaultSettings: true
      }
    })

    if (!tmp) {
      return tmp
    }

    return addUserGraphqlAliases(tmp)
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Query(() => DeviceQuery)
  @Mutation(() => DeviceMutation)
  async currentDevice(
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    const { jwtPayload } = ctx

    const currentDevice = await ctx.db.query.device.findFirst({
      where: { id: jwtPayload.deviceId }
    })

    return currentDevice
  }

  @Mutation(() => LoginResponse)
  async registerNewUser(
    @Arg('input', () => RegisterNewAccountInput) input: RegisterNewAccountInput,
    @Arg('userId', () => GraphQLUUID) userId: string,
    @Ctx() ctx: IContext
  ) {
    const ipAddress = ctx.getIpAddress()
    const {
      email,
      firebaseToken,
      deviceName,
      deviceId,
      addDeviceSecret,
      addDeviceSecretEncrypted,
      encryptionSalt
    } = input
    let user: any
    let devices: any[]

    try {
      // Insert user
      const [insertedUser] = await ctx.db
        .insert(schema.user)
        .values({
          id: userId,
          email: email,
          addDeviceSecret,
          addDeviceSecretEncrypted,
          encryptionSalt,
          deviceRecoveryCooldownMinutes: 16 * 60,
          loginCredentialsLimit: 40,
          TOTPlimit: 3
        })
        .returning()

      // Insert device
      const [insertedDevice] = await ctx.db
        .insert(schema.device)
        .values({
          platform: input.devicePlatform,
          id: deviceId,
          firstIpAddress: ipAddress,
          lastIpAddress: ipAddress,
          firebaseToken: firebaseToken,
          name: deviceName,
          autofillCredentialsEnabled: true,
          vaultLockTimeoutSeconds: 28800,
          syncTOTP: true,
          autofillTOTPEnabled: true,
          userId: userId
        })
        .returning()

      user = insertedUser
      devices = [insertedDevice]
    } catch (err: unknown) {
      // Drizzle wraps PG errors in DrizzleQueryError with the original error in .cause
      const pgError = (err as { cause?: { code?: string; detail?: string } })
        .cause

      // Handle unique constraint violations
      if (pgError?.code === '23505') {
        const detail = pgError.detail || ''
        if (detail.includes('email')) {
          log('email', email)
          throw new GraphqlError(`User with such email already exists.`)
        }
        if (detail.includes('id')) {
          log('deviceId', deviceId)
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `deleting device ${deviceId} because we are in dev mode and we don't care about the other account`
            )
            await ctx.db
              .delete(schema.device)
              .where(eq(schema.device.id, deviceId))
            return this.registerNewUser(input, userId, ctx)
          } else {
            throw new GraphqlError(
              `Device ${deviceId} already exists. You cannot use a device with multiple accounts.`
            )
          }
        }
      }
      throw err
    }

    const device = devices[0]
    // Update user with masterDeviceId
    const [updatedUser] = await ctx.db
      .update(schema.user)
      .set({
        masterDeviceId: device.id
      })
      .where(eq(schema.user.id, user.id))
      .returning()
    user = updatedUser

    return new UserMutation(user).setCookiesAndConstructLoginResponse(
      device,
      ctx
    )
  }

  // TODO rate limit this per IP
  @Mutation(() => DecryptionChallengeUnion, {
    description: 'returns a decryption challenge, used when logging in',
    nullable: true
  })
  async deviceDecryptionChallenge(
    @Arg('email', () => GraphQLEmailAddress) email: string,
    @Arg('deviceInput', () => DeviceInput)
    deviceInput: DeviceInput,
    @Ctx() ctx: IContext
  ) {
    const ipAddress = ctx.getIpAddress()

    const user = await ctx.db.query.user.findFirst({
      where: { email },
      columns: {
        id: true,
        addDeviceSecretEncrypted: true,
        encryptionSalt: true,
        newDevicePolicy: true,
        masterDeviceId: true
      }
    })

    if (!user) {
      throw new GraphqlError(
        'Login failed, check your email and master password'
      )
    }

    // Fetch masterDevice separately since it's not a relation but a FK column
    const masterDevice = user.masterDeviceId
      ? await ctx.db.query.device.findFirst({
          where: { id: user.masterDeviceId }
        })
      : null
    const userHasNoMasterDevice = !user.masterDeviceId
    const isBlocked = await ctx.db.query.decryptionChallenge.findFirst({
      where: {
        userId: user.id,
        blockIp: true,
        ipAddress
      }
    })

    if (isBlocked) {
      throw new GraphqlError('Login failed, try again later.')
    }

    const inLastHourResult = await ctx.db
      .select({ count: count() })
      .from(schema.decryptionChallenge)
      .where(
        and(
          eq(schema.decryptionChallenge.userId, user.id),
          gte(
            schema.decryptionChallenge.createdAt,
            new Date(Date.now() - 3600000)
          ),
          sql`${schema.decryptionChallenge.masterPasswordVerifiedAt} IS NULL`
        )
      )
    const inLastHour = inLastHourResult[0]?.count ?? 0

    if (inLastHour > 5) {
      throw new GraphqlError(
        'Too many decryption challenges, wait for cooldown'
      )
    }

    const device = await ctx.db.query.device.findFirst({
      where: { id: deviceInput.id }
    })

    log('device', device)

    let challenge = await ctx.db.query.decryptionChallenge.findFirst({
      where: {
        deviceId: deviceInput.id,
        userId: user.id
      }
    })

    //TODO: Check this condition, not sure what is this doing
    if (device) {
      if (!challenge) {
        const deviceCountResult = await ctx.db
          .select({ count: count() })
          .from(schema.device)
          .where(eq(schema.device.userId, user.id))
        const deviceCount = deviceCountResult[0]?.count ?? 0
        //FIX: This is not working, we need to check if the device is already approved
        if (deviceCount === 1) {
          // user has only one device
          const [created] = await ctx.db
            .insert(schema.decryptionChallenge)
            .values({
              deviceId: deviceInput.id,
              deviceName: deviceInput.name,
              userId: user.id,
              ipAddress,
              approvedAt: device.createdAt
            })
            .returning()
          challenge = created
        }
      }
    }

    if (challenge?.rejectedAt) {
      // someone tried to login with this device and it was rejected in the past, we don't want to create a new challenge
      throw new GraphqlError('login failed')
    }

    if (challenge && userHasNoMasterDevice && !challenge.approvedAt) {
      const [updatedChallenge] = await ctx.db
        .update(schema.decryptionChallenge)
        .set({
          approvedAt: new Date()
        })
        .where(eq(schema.decryptionChallenge.id, challenge.id))
        .returning()
      challenge = updatedChallenge
    }

    if (!challenge) {
      let pushNotificationCounts: PushDeliveryCounts = {
        pushNotificationsSentCount: 0,
        pushNotificationsFailedCount: 0
      }

      let approvedAt: Date | undefined

      if (userHasNoMasterDevice) {
        approvedAt = new Date()
      } else {
        // TODO: send email notifications
        const geoIp = await getGeoIpLocation
          .memoized(ipAddress)
          .catch((_error) => null)

        const geoLocationParts = geoIp
          ? [geoIp.city, geoIp.region_name, geoIp.country_name].filter(Boolean)
          : []
        const geoLocation =
          geoLocationParts.length > 0 ? geoLocationParts.join(', ') : null

        let notificationBody = `New device is trying to log in from ${ipAddress}.`

        if (geoLocation) {
          notificationBody = `New device is trying to log in from ${ipAddress} (${geoLocation}).`
        }

        let devicesToNotify: { firebaseToken: string | null }[] = []

        if (user.newDevicePolicy === 'REQUIRE_ANY_DEVICE_APPROVAL') {
          devicesToNotify = await ctx.db.query.device.findMany({
            where: { userId: user.id },
            columns: { firebaseToken: true }
          })
        } else if (masterDevice?.firebaseToken) {
          devicesToNotify = [{ firebaseToken: masterDevice.firebaseToken }]
        }

        const firebaseTokens = [
          ...new Set(
            devicesToNotify
              .map((device) => device.firebaseToken)
              .filter(
                (firebaseToken): firebaseToken is string => !!firebaseToken
              )
              .filter((firebaseToken) => firebaseToken.length > 10)
          )
        ]

        pushNotificationCounts = await sendNewDeviceLoginPushNotifications(
          firebaseTokens,
          notificationBody
        )
      }

      const [created] = await ctx.db
        .insert(schema.decryptionChallenge)
        .values({
          deviceId: deviceInput.id,
          deviceName: deviceInput.name,
          userId: user.id,
          ipAddress: ctx.getIpAddress(),
          approvedAt,
          pushNotificationsSentCount:
            pushNotificationCounts.pushNotificationsSentCount,
          pushNotificationsFailedCount:
            pushNotificationCounts.pushNotificationsFailedCount
        })
        .returning()
      challenge = created
    }

    if (userHasNoMasterDevice) {
      return plainToClass(DecryptionChallengeApproved, {
        ...challenge,
        addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
        encryptionSalt: user.encryptionSalt,
        approvedAt: challenge!.approvedAt || challenge!.createdAt
      })
    }

    if (user.newDevicePolicy === 'ALLOW' || user.newDevicePolicy === null) {
      // user has allowed new devices, we can return the challenge including salt and encrypted secret
      return plainToClass(DecryptionChallengeApproved, {
        ...challenge,
        addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
        encryptionSalt: user.encryptionSalt,
        approvedAt: challenge!.approvedAt || challenge!.createdAt
      })
    }

    const [masterDeviceResetRequest] = await ctx.db
      .select({
        requestedAt: schema.masterDeviceResetRequest.createdAt,
        processAt: schema.masterDeviceResetRequest.processAt,
        rejectedAt: schema.masterDeviceResetRequest.rejectedAt
      })
      .from(schema.masterDeviceResetRequest)
      .where(
        eq(schema.masterDeviceResetRequest.decryptionChallengeId, challenge!.id)
      )
      .limit(1)

    if (!challenge!.approvedAt) {
      return plainToClass(DecryptionChallengeForApproval, {
        id: challenge!.id,
        ipAddress: challenge!.ipAddress,
        rejectedAt: challenge!.rejectedAt,
        createdAt: challenge!.createdAt,
        deviceName: challenge!.deviceName,
        deviceId: challenge!.deviceId,
        pushNotificationsSentCount: challenge!.pushNotificationsSentCount,
        pushNotificationsFailedCount: challenge!.pushNotificationsFailedCount,
        masterDeviceResetRequestedAt:
          masterDeviceResetRequest?.requestedAt ?? null,
        masterDeviceResetProcessAt: masterDeviceResetRequest?.processAt ?? null,
        masterDeviceResetRejectedAt:
          masterDeviceResetRequest?.rejectedAt ?? null
      })
    }

    // user has approved this device in the past, we can return the challenge including salt and encrypted secret
    return plainToClass(DecryptionChallengeApproved, {
      ...challenge,
      addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
      encryptionSalt: user.encryptionSalt
    })
  }

  @Mutation(() => MasterDeviceResetRequestResult, {
    description:
      'initiates a delayed reset of the master device when the user cannot approve from an existing device'
  })
  async initiateMasterDeviceReset(
    @Arg('email', () => GraphQLEmailAddress) email: string,
    @Arg('deviceInput', () => DeviceInput) deviceInput: DeviceInput,
    @Arg('decryptionChallengeId', () => GraphQLPositiveInt)
    decryptionChallengeId: number,
    @Ctx() ctx: IContext
  ) {
    const ipAddress = ctx.getIpAddress()

    const user = await ctx.db.query.user.findFirst({
      where: { email },
      columns: {
        id: true,
        email: true,
        masterDeviceId: true,
        deviceRecoveryCooldownMinutes: true
      }
    })

    if (!user) {
      throw new GraphqlError(
        'Login failed, check your email and master password'
      )
    }

    const challenge = await ctx.db.query.decryptionChallenge.findFirst({
      where: {
        id: decryptionChallengeId,
        userId: user.id,
        deviceId: deviceInput.id
      }
    })

    if (!challenge || challenge.rejectedAt) {
      throw new GraphqlError('login failed')
    }

    const now = new Date()
    const [activeResetRequest] = await ctx.db
      .select({
        id: schema.masterDeviceResetRequest.id,
        requestedAt: schema.masterDeviceResetRequest.createdAt,
        processAt: schema.masterDeviceResetRequest.processAt
      })
      .from(schema.masterDeviceResetRequest)
      .where(
        and(
          eq(schema.masterDeviceResetRequest.userId, user.id),
          isNull(schema.masterDeviceResetRequest.completedAt),
          isNull(schema.masterDeviceResetRequest.rejectedAt)
        )
      )
      .orderBy(desc(schema.masterDeviceResetRequest.createdAt))
      .limit(1)

    if (activeResetRequest) {
      return plainToClass(MasterDeviceResetRequestResult, {
        requestedAt: activeResetRequest.requestedAt,
        processAt: activeResetRequest.processAt,
        alreadyPending: true
      })
    }

    if (!user.masterDeviceId) {
      return plainToClass(MasterDeviceResetRequestResult, {
        requestedAt: now,
        processAt: now,
        alreadyPending: false
      })
    }

    const requestedAt = now
    const processAt = new Date(
      requestedAt.getTime() + user.deviceRecoveryCooldownMinutes * 60_000
    )

    const [existingResetRequestForChallenge] = await ctx.db
      .select({
        id: schema.masterDeviceResetRequest.id
      })
      .from(schema.masterDeviceResetRequest)
      .where(
        eq(schema.masterDeviceResetRequest.decryptionChallengeId, challenge.id)
      )
      .limit(1)

    if (existingResetRequestForChallenge) {
      await ctx.db
        .update(schema.masterDeviceResetRequest)
        .set({
          createdAt: requestedAt,
          processAt,
          completedAt: null,
          rejectedAt: null,
          targetMasterDeviceId: user.masterDeviceId
        })
        .where(
          eq(
            schema.masterDeviceResetRequest.id,
            existingResetRequestForChallenge.id
          )
        )
    } else {
      await ctx.db.insert(schema.masterDeviceResetRequest).values({
        userId: user.id,
        decryptionChallengeId: challenge.id,
        targetMasterDeviceId: user.masterDeviceId,
        processAt
      })
    }

    if (user.email) {
      await sendEmail(user.email, {
        Subject: 'Master device reset initiated',
        TextPart: `A delayed reset of your master device was initiated for account ${user.email} from IP ${ipAddress}.
If this was you, no action is needed.
The reset is scheduled for ${processAt.toISOString()}.
If this was not you, log in from one of your existing devices and change your master device before that time.`,
        HTMLPart: `<p>A delayed reset of your master device was initiated for account ${user.email} from IP ${ipAddress}.</p><p>If this was you, no action is needed.</p><p>The reset is scheduled for <strong>${processAt.toISOString()}</strong>.</p><p>If this was not you, log in from one of your existing devices and change your master device before that time.</p>`
      })
    }

    return plainToClass(MasterDeviceResetRequestResult, {
      requestedAt,
      processAt,
      alreadyPending: false
    })
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => Int, {
    nullable: true,
    deprecationReason: 'prefer device methods',
    description:
      'removes current device. Returns null if user is not authenticated, alias for device logout/remove methods'
  })
  async logout(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('removeDevice', () => Boolean, { nullable: true })
    removeDevice: boolean
  ) {
    ctx.reply.clearCookie('refresh-token')
    ctx.reply.clearCookie('access-token')

    if (!ctx.jwtPayload) {
      return null
    }

    // Update the device with logoutAt
    await ctx.db
      .update(schema.device)
      .set({
        logoutAt: new Date()
      })
      .where(eq(schema.device.id, ctx.jwtPayload.deviceId))

    // Get user for token version
    const user = await ctx.db.query.user.findFirst({
      where: { id: ctx.jwtPayload.userId }
    })

    if (removeDevice) {
      await ctx.db
        .delete(schema.device)
        .where(eq(schema.device.id, ctx.jwtPayload.deviceId))
      await ctx.db
        .delete(schema.decryptionChallenge)
        .where(eq(schema.decryptionChallenge.deviceId, ctx.jwtPayload.deviceId))
    }
    return user?.tokenVersion
  }

  @Query(() => [WebInputGQLScalars])
  async webInputs(
    @Arg('hosts', () => [String], {
      nullable: true,
      description: 'accepts strings like example.com and similar'
    })
    hosts: string[] | null,
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (hosts) {
      if (hosts.length === 0) {
        return []
      }

      const formattedDomains = hosts.map((url) => {
        const strippedUrl = url.replace('www.', '')
        return `%${strippedUrl}`
      })

      // TODO only return new web inputs created after last sync
      const results = await ctx.db
        .select()
        .from(schema.webInput)
        .where(
          or(
            ...formattedDomains.map((domain) =>
              like(schema.webInput.host, domain)
            )
          )
        )
      return results
    }

    return []
  }

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => WebInputMutation, {
    nullable: true
  })
  @Query(() => WebInputGQL, {
    nullable: true
  })
  async webInput(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: IContextAuthenticated
  ) {
    return ctx.db.query.webInput.findFirst({
      where: { id }
    })
  }
  2

  @UseMiddleware(throwIfNotAuthenticated)
  @Mutation(() => [WebInputGQL])
  async addWebInputs(
    @Arg('webInputs', () => [WebInputElement]) webInputs: WebInputElement[],
    @Ctx() ctx: IContextAuthenticated
  ) {
    const returnedInputs: any[] = []
    for (const webInput of webInputs) {
      const host = constructURL(webInput.url).host
      if (!host) {
        continue
      }
      const forUpsert = {
        url: webInput.url.split('?')[0], // query can often have sensitive data, so we omit it here and on FE too
        host: host,
        domPath: webInput.domPath,
        kind: webInput.kind,
        addedByUserId: ctx.jwtPayload.userId
      }

      const existing = await ctx.db.query.webInput.findFirst({
        where: {
          url: forUpsert.url,
          kind: forUpsert.kind
        },
        columns: {
          id: true
        }
      })

      if (existing) {
        // it can happen that website changes the input field, so we delete the old one and add the new one
        await ctx.db
          .delete(schema.webInput)
          .where(eq(schema.webInput.id, existing.id))
      }

      try {
        // Try to insert, on conflict update
        const [input] = await ctx.db
          .insert(schema.webInput)
          .values(forUpsert as any)
          .onConflictDoUpdate({
            target: [schema.webInput.url, schema.webInput.domPath],
            set: forUpsert as any
          })
          .returning()
        returnedInputs.push(input)
      } catch (err: unknown) {
        console.warn('error adding web input', err)
      }
    }
    return returnedInputs
  }
}
