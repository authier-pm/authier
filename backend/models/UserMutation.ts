import { Arg, Ctx, Field, ID, Info, Int, ObjectType } from 'type-graphql'
import type { IContext, IContextAuthenticated } from './types/ContextTypes'
import {
  EncryptedSecretMutation,
  EncryptedSecretQuery
} from './EncryptedSecret'
import { EncryptedSecretInput, SettingsInput } from './models'
import { UserGQL } from './generated/UserGQL'

import { DeviceGQL } from './generated/DeviceGQL'
import { UserBase, UserQuery } from './UserQuery'
import { GraphQLInt } from 'graphql'
import type { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromGQLInfo } from '../utils/getPrismaRelationsFromInfo'
import { ChangeMasterPasswordInput } from './AuthInputs'
import {
  GraphQLEmailAddress,
  GraphQLNonNegativeInt,
  GraphQLUUID
} from 'graphql-scalars'
import { sendEmail } from '../utils/email'
import { v4 as uuidv4 } from 'uuid'

import { DecryptionChallengeMutation } from './DecryptionChallenge'

import { DeviceInput } from './Device'
import { DeviceMutation } from './Device'
import { SecretUsageEventInput } from './types/SecretUsageEventInput'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEventGQL'
import { MasterDeviceChangeGQL } from './generated/MasterDeviceChangeGQL'
import { GraphqlError } from '../lib/GraphqlError'
import debug from 'debug'
import { setNewRefreshToken } from '../userAuth'
import { DefaultDeviceSettingsMutation } from './DefaultDeviceSettings'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'
import { UserNewDevicePolicyGQL } from './types/UserNewDevicePolicy'
import { eq, and, sql, inArray, isNull, count } from 'drizzle-orm'
import {
  device as deviceSchema,
  defaultSettings as defaultSettingsSchema,
  encryptedSecret as encryptedSecretSchema,
  secretUsageEvent as secretUsageEventSchema,
  user as userSchema,
  emailVerification as emailVerificationSchema,
  decryptionChallenge as decryptionChallengeSchema,
  masterDeviceChange as masterDeviceChangeSchema,
  masterDeviceResetRequest as masterDeviceResetRequestSchema,
  userPaidProducts as userPaidProductsSchema
} from '../drizzle/schema'

const log = debug('au:userMutation')

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => String)
  async addCookie(@Ctx() ctx: IContext) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This is only for development')
    }

    const firstDev = await ctx.db.query.device.findFirst()
    if (firstDev) {
      const { accessToken } = await this.setCookiesAndConstructLoginResponse(
        firstDev as any,
        ctx
      )
      return accessToken
    }
  }

  @Field(() => DeviceMutation)
  async device(@Ctx() ctx: IContext, @Arg('id', () => String) id: string) {
    return ctx.db.query.device.findFirst({
      where: { userId: this.id, id: id }
    })
  }

  @Field(() => DefaultDeviceSettingsMutation)
  async defaultDeviceSettings(@Ctx() ctx: IContext) {
    return super.defaultDeviceSettings(ctx)
  }

  @Field(() => DeviceGQL)
  async addDevice(
    @Arg('device', () => DeviceInput) deviceParams: DeviceInput,
    @Arg('firebaseToken', () => String, {
      nullable: true,
      description: 'Firebase token is only used for mobile app'
    })
    firebaseToken: string | null,
    @Ctx() ctx: IContext
  ) {
    const ipAddress: string = ctx.getIpAddress()

    const deviceDefaultSettings =
      (await ctx.db.query.defaultSettings.findFirst({
        where: { userId: this.id }
      })) ?? defaultDeviceSettingSystemValues

    const res = await ctx.db
      .insert(deviceSchema)
      .values({
        platform: deviceParams.platform,
        name: deviceParams.name,
        id: deviceParams.id,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: this.id,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: deviceDefaultSettings.vaultLockTimeoutSeconds,
        autofillCredentialsEnabled:
          deviceDefaultSettings.autofillCredentialsEnabled,
        autofillTOTPEnabled: deviceDefaultSettings.autofillTOTPEnabled,
        syncTOTP: deviceDefaultSettings.syncTOTP
      })
      .returning()
    return res[0]
  }

  @Field(() => EncryptedSecretMutation)
  async encryptedSecret(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    // Note: getPrismaRelationsFromGQLInfo won't work with Drizzle out of the box.
    // Drizzle relations are nested via nested objects instead of Prisma `include`.
    // Returning basic data here and it may limit deep inclusions.
    return ctx.db.query.encryptedSecret.findFirst({
      where: { id: id }
    })
  }

  @Field(() => SecretUsageEventGQLScalars)
  async createSecretUsageEvent(
    @Arg('event', () => SecretUsageEventInput)
    event: SecretUsageEventInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    const res = await ctx.db
      .insert(secretUsageEventSchema)
      .values({
        kind: event.kind,
        url: event.url,
        deviceId: ctx.device.id,
        userId: this.id,
        ipAddress: ctx.getIpAddress(),
        secretId: event.secretId
      })
      .returning()
    return res[0]
  }

  @Field(() => [EncryptedSecretMutation])
  async removeEncryptedSecrets(
    @Arg('secrets', () => [GraphQLUUID])
    secrets: string[],
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (secrets.length === 0) return []

    const res = await ctx.db
      .update(encryptedSecretSchema)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(inArray(encryptedSecretSchema.id, secrets))
      .returning()

    return res
  }

  @Field(() => [EncryptedSecretQuery])
  async addEncryptedSecrets(
    @Arg('secrets', () => [EncryptedSecretInput])
    secrets: EncryptedSecretInput[],
    @Ctx() ctx: IContextAuthenticated
  ) {
    const userData = await ctx.db.query.user.findFirst({
      where: { id: ctx.jwtPayload.userId }
    })

    const pswLimit = userData?.loginCredentialsLimit ?? 40
    const TOTPLimit = userData?.TOTPlimit ?? 3

    let [{ count: pswCount }] = await ctx.db
      .select({ count: count() })
      .from(encryptedSecretSchema)
      .where(
        and(
          eq(encryptedSecretSchema.userId, ctx.jwtPayload.userId),
          eq(encryptedSecretSchema.kind, 'LOGIN_CREDENTIALS'),
          isNull(encryptedSecretSchema.deletedAt)
        )
      )

    let [{ count: TOTPCount }] = await ctx.db
      .select({ count: count() })
      .from(encryptedSecretSchema)
      .where(
        and(
          eq(encryptedSecretSchema.userId, ctx.jwtPayload.userId),
          eq(encryptedSecretSchema.kind, 'TOTP'),
          isNull(encryptedSecretSchema.deletedAt)
        )
      )

    secrets.forEach((secret) => {
      if (secret.kind === 'LOGIN_CREDENTIALS') {
        pswCount++
      } else if (secret.kind === 'TOTP') {
        TOTPCount++
      }
    })

    if (pswCount > pswLimit) {
      console.log('psw exceeded')
      return new GraphqlError(`Password limit exceeded.`)
    }

    if (TOTPCount > TOTPLimit) {
      console.log('TOTP exceeded')
      return new GraphqlError(`TOTP limit exceeded.`)
    }

    if (secrets.length === 0) return []

    const res = await ctx.db
      .insert(encryptedSecretSchema)
      .values(
        secrets.map((secret) => ({
          id: crypto.randomUUID(),
          version: 1,
          userId: this.id,
          encrypted: secret.encrypted,
          kind: secret.kind
        }))
      )
      .returning()

    return res
  }

  @Field(() => DeviceGQL)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    const res = await ctx.db
      .update(deviceSchema)
      .set({
        firebaseToken: firebaseToken
      })
      .where(eq(deviceSchema.id, this.masterDeviceId))
      .returning()
    return res[0]
  }

  @Field(() => UserGQL)
  async updateSettings(
    @Arg('config', () => SettingsInput) config: SettingsInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    await ctx.db
      .update(deviceSchema)
      .set({
        syncTOTP: config.syncTOTP,
        vaultLockTimeoutSeconds: config.vaultLockTimeoutSeconds,
        autofillCredentialsEnabled: config.autofillCredentialsEnabled,
        autofillTOTPEnabled: config.autofillTOTPEnabled
      })
      .where(eq(deviceSchema.id, ctx.device.id))

    const res = await ctx.db
      .update(userSchema)
      .set({
        notificationOnVaultUnlock: config.notificationOnVaultUnlock,
        uiLanguage: config.uiLanguage,
        notificationOnWrongPasswordAttempts:
          config.notificationOnWrongPasswordAttempts
      })
      .where(eq(userSchema.id, this.id))
      .returning()

    return res[0]
  }

  @Field(() => GraphQLNonNegativeInt)
  async sendEmailVerification(
    @Ctx() ctx: IContext,
    @Arg('isMobile', () => Boolean, {
      nullable: true
    })
    isMobile: boolean | null
  ) {
    if (this.email) {
      let verification = await ctx.db.query.emailVerification.findFirst({
        where: { address: this.email! }
      })

      if (!verification) {
        const res = await ctx.db
          .insert(emailVerificationSchema)
          .values({
            token: uuidv4(),
            address: this.email,
            userId: this.id,
            kind: 'PRIMARY'
          })
          .returning()
        verification = res[0]
      }

      const link = `${process.env.FRONTEND_URL}/verify-email?token=${verification.token}`

      const notifMessage = isMobile
        ? 'Verified email can be used to recover in case you lose your master device.'
        : 'It will be used as your primary notification channel until you install the mobile app. If you prefer mobile notifications, install our mobile app.'

      const res = await sendEmail(
        this.email,

        {
          Subject: 'Verify your email',
          TextPart: `To verify your email, please go here: ${link} \n ${notifMessage}`,
          HTMLPart: `<!DOCTYPE html>
          <html>
          <body>
          <a href="${link}" rel="notrack">Please verify your email.</a> ${notifMessage}
          </body>
          </html>`
        }
      )
      return res.response.status === 200 ? 1 : 0
    }
  }

  //For testing purposes
  @Field(() => UserGQL)
  async revokeRefreshTokensForUser(@Ctx() ctx: IContext) {
    const res = await ctx.db
      .update(userSchema)
      .set({
        tokenVersion: sql`${userSchema.tokenVersion} + 1`
      })
      .where(eq(userSchema.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => GraphQLInt)
  async changeMasterPassword(
    @Arg('input', () => ChangeMasterPasswordInput)
    input: ChangeMasterPasswordInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (ctx.device.id !== this.masterDeviceId) {
      throw new Error('You can only change password on a master device')
    }

    let targetUser: any

    await ctx.db.transaction(async (tx) => {
      const userRes = await tx
        .update(userSchema)
        .set({
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          tokenVersion: sql`${userSchema.tokenVersion} + 1`
        })
        .where(eq(userSchema.id, this.id))
        .returning()

      targetUser = userRes[0]

      await tx
        .update(decryptionChallengeSchema)
        .set({
          masterPasswordVerifiedAt: new Date()
        })
        .where(
          and(
            eq(decryptionChallengeSchema.id, input.decryptionChallengeId),
            eq(decryptionChallengeSchema.deviceId, ctx.jwtPayload.deviceId),
            eq(decryptionChallengeSchema.userId, this.id)
          )
        )

      for (const { id, ...patch } of input.secrets) {
        await tx
          .update(encryptedSecretSchema)
          .set({
            ...patch,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(encryptedSecretSchema.id, id))
      }
    })

    setNewRefreshToken(targetUser, ctx.device, ctx) // set new refresh token to force all other devices to re-login
    return input.secrets.length
  }

  @Field(() => UserQuery)
  async changeEmail(
    @Arg('email', () => GraphQLEmailAddress)
    email: string,
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (ctx.device.id !== this.masterDeviceId) {
      console.log(`${ctx.device.id} vs ${this.masterDeviceId}`)
      throw new GraphqlError(
        'You can only change login email from master device'
      )
    }

    return ctx.db.transaction(async (trx) => {
      const oldEmail = this.email
      const res = await trx
        .update(userSchema)
        .set({ email })
        .where(eq(userSchema.id, this.id))
        .returning()
      const updatedUser = res[0]

      await sendEmail(oldEmail!, {
        Subject: 'Your login email has been changed',
        TextPart: `Your login email has been changed from ${oldEmail} to ${email}. 
        If you did not do this you should consider your master device compromised.
        Request was made from ip: ${ctx.getIpAddress()}
        `
      })

      return updatedUser
    })
  }

  @Field(() => DecryptionChallengeMutation)
  async decryptionChallenge(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('id', () => Int) id: number
  ) {
    return ctx.db.query.decryptionChallenge.findFirst({
      where: {
        id: id,
        userId: ctx.jwtPayload.userId
      }
    })
  }

  @Field(() => UserGQL)
  async setNewDevicePolicy(
    @Arg('newDevicePolicy', () => UserNewDevicePolicyGQL)
    newDevicePolicy: UserNewDevicePolicyGQL,
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (
      this.newDevicePolicy !== null &&
      ctx.device.id !== this.masterDeviceId
    ) {
      throw new GraphqlError(
        'newDevicePolicy can be set only from master device'
      )
    }

    const res = await ctx.db
      .update(userSchema)
      .set({
        newDevicePolicy: newDevicePolicy as any
      })
      .where(eq(userSchema.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => UserGQL)
  async setDeviceRecoveryCooldownMinutes(
    @Arg('deviceRecoveryCooldownMinutes', () => GraphQLNonNegativeInt)
    deviceRecoveryCooldownMinutes: number,
    @Ctx() ctx: IContextAuthenticated
  ) {
    if (
      this.masterDeviceId !== null &&
      this.masterDeviceId !== undefined &&
      ctx.device.id !== this.masterDeviceId
    ) {
      throw new GraphqlError(
        'deviceRecoveryCooldownMinutes can be set only from master device'
      )
    }

    const res = await ctx.db
      .update(userSchema)
      .set({
        deviceRecoveryCooldownMinutes
      })
      .where(eq(userSchema.id, this.id))
      .returning()
    return res[0]
  }

  @Field(() => MasterDeviceChangeGQL)
  async setMasterDevice(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('newMasterDeviceId', () => String) newMasterDeviceId: string
  ) {
    if (ctx.device.id !== ctx.masterDeviceId) {
      throw new GraphqlError('This can be done only from master device')
    }

    let updatedUser: any

    await ctx.db.transaction(async (tx) => {
      const res = await tx
        .update(userSchema)
        .set({
          masterDeviceId: newMasterDeviceId
        })
        .where(eq(userSchema.id, ctx.jwtPayload.userId))
        .returning()
      updatedUser = res[0]

      await tx
        .delete(masterDeviceResetRequestSchema)
        .where(
          and(
            eq(masterDeviceResetRequestSchema.userId, ctx.jwtPayload.userId),
            eq(
              masterDeviceResetRequestSchema.targetMasterDeviceId,
              ctx.masterDeviceId!
            ),
            isNull(masterDeviceResetRequestSchema.completedAt),
            isNull(masterDeviceResetRequestSchema.rejectedAt)
          )
        )

      await tx.insert(masterDeviceChangeSchema).values({
        id: uuidv4(),
        oldDeviceId: ctx.masterDeviceId!,
        newDeviceId: newMasterDeviceId,
        processAt: new Date(),
        userId: ctx.jwtPayload.userId
      })
    })

    return updatedUser
  }

  @Field(() => String)
  async createPortalSession(@Ctx() ctx: IContextAuthenticated) {
    const stripeClient = ctx.getStripeClient()
    const product = await ctx.db.query.userPaidProducts.findFirst({
      where: { userId: ctx.jwtPayload.userId },
      orderBy: (upp, { desc }) => [desc(upp.createdAt)]
    })

    if (!product) {
      throw new GraphqlError("You don't have a paid subscription")
    }

    const checkoutSession = await stripeClient.checkout.sessions.retrieve(
      product?.checkoutSessionId as string
    )

    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = `${process.env.FRONTEND_URL}/pricing`

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: checkoutSession.customer as string,
      return_url: returnUrl
    })

    return portalSession.url
  }

  @Field(() => String)
  async createCheckoutSession(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('product', () => String) product: string
  ) {
    const stripeClient = ctx.getStripeClient()
    const userPaidProduct = await ctx.db.query.userPaidProducts.findFirst({
      where: { userId: ctx.jwtPayload.userId }
    })

    const productItem = await stripeClient.products.retrieve(product)

    if (userPaidProduct) {
      const checkoutSession = await stripeClient.checkout.sessions.retrieve(
        userPaidProduct?.checkoutSessionId as string
      )

      const session = await stripeClient.checkout.sessions.create({
        billing_address_collection: 'auto',
        line_items: [
          {
            price: productItem['default_price'] as string,
            //For metered billing, do not pass quantity
            quantity: 1
          }
        ],
        metadata: {
          productId: productItem.id
        },
        customer: checkoutSession.customer as string,
        mode: 'subscription',
        success_url: `${ctx.request.headers.referer}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.request.headers.referer}?canceled=true`
      })

      return session.id
    } else {
      const newCustomer = await ctx.db.query.user.findFirst({
        where: { id: ctx.jwtPayload.userId }
      })

      const session = await stripeClient.checkout.sessions.create({
        billing_address_collection: 'auto',
        customer_email: newCustomer?.email as string,
        line_items: [
          {
            price: productItem['default_price'] as string,
            //For metered billing, do not pass quantity
            quantity: 1
          }
        ],
        metadata: {
          productId: productItem.id
        },
        mode: 'subscription',
        success_url: `${ctx.request.headers.referer}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.request.headers.referer}?canceled=true`
      })

      return session.id
    }
  }

  @Field(() => UserGQL)
  async delete(@Ctx() ctx: IContextAuthenticated) {
    const res = await ctx.db
      .delete(userSchema)
      .where(eq(userSchema.id, this.id))
      .returning()

    log('deleted user', res[0]?.email)
    ctx.reply.clearCookie('refresh-token')
    ctx.reply.clearCookie('access-token')
    return res[0]
  }
}
