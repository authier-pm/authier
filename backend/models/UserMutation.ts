import { Arg, Ctx, Field, ID, Info, Int, ObjectType } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import {
  EncryptedSecretMutation,
  EncryptedSecretQuery
} from './EncryptedSecret'
import { EncryptedSecretInput, SettingsInput } from './models'

import { UserGQL } from './generated/UserGQL'

import { DeviceGQL } from './generated/DeviceGQL'
import { UserBase, UserQuery } from './UserQuery'
import { GraphQLResolveInfo } from 'graphql'
import { getPrismaRelationsFromInfo } from '../utils/getPrismaRelationsFromInfo'
import { ChangeMasterPasswordInput } from './AuthInputs'
import { GraphQLNonNegativeInt, GraphQLPositiveInt } from 'graphql-scalars'
import { sendEmail } from '../utils/email'
import { v4 as uuidv4 } from 'uuid'

import { EmailVerificationType } from '.prisma/client'
import { DecryptionChallengeMutation } from './DecryptionChallenge'
import { dmmf } from '../prisma/prismaClient'
import { DeviceInput } from './Device'
import { DeviceMutation } from './Device'
import { stripe } from '../stripe'
import { SecretUsageEventInput } from './types/SecretUsageEventInput'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEventGQL'
import { MasterDeviceChangeGQL } from './generated/MasterDeviceChangeGQL'
import { GraphqlError } from '../api/GraphqlError'
import debug from 'debug'
const log = debug('au:userMutation')

@ObjectType()
export class UserMutation extends UserBase {
  @Field(() => String)
  // TODO remove before putting into prod
  async addCookie(@Ctx() ctx: IContext) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This is only for development')
    }

    const firstDev = await ctx.prisma.device.findFirst()
    if (firstDev) {
      const { accessToken } = this.setCookiesAndConstructLoginResponse(
        firstDev.id,
        ctx
      )
      return accessToken
    }
  }

  @Field(() => DeviceMutation)
  async device(@Ctx() ctx: IContext, @Arg('id', () => String) id: string) {
    return ctx.prisma.device.findFirst({
      where: {
        userId: this.id,
        id
      }
    })
  }

  @Field(() => DeviceGQL)
  async addDevice(
    @Arg('device', () => DeviceInput) device: DeviceInput,
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    const ipAddress: string = ctx.getIpAddress()

    return await ctx.prisma.device.create({
      data: {
        platform: device.platform,
        name: device.name,
        id: device.id,
        firebaseToken: firebaseToken,
        firstIpAddress: ipAddress,
        userId: this.id,
        lastIpAddress: ipAddress,
        vaultLockTimeoutSeconds: 60
      }
    })
  }

  @Field(() => EncryptedSecretMutation)
  async encryptedSecret(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: IContextAuthenticated,
    @Info() info: GraphQLResolveInfo
  ) {
    return ctx.prisma.encryptedSecret.findUnique({
      where: { id },
      include: getPrismaRelationsFromInfo({
        info,
        rootModel: dmmf.modelMap.EncryptedSecret
      })
    })
  }
  @Field(() => SecretUsageEventGQLScalars)
  async createSecretUsageEvent(
    @Arg('event', () => SecretUsageEventInput)
    event: SecretUsageEventInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    return ctx.prisma.secretUsageEvent.create({
      data: {
        kind: event.kind,
        url: event.url,
        deviceId: ctx.device.id,
        userId: this.id,
        ipAddress: ctx.getIpAddress(),
        secretId: event.secretId
      }
    })
  }
  @Field(() => [EncryptedSecretQuery])
  async addEncryptedSecrets(
    @Arg('secrets', () => [EncryptedSecretInput])
    secrets: EncryptedSecretInput[],
    @Ctx() ctx: IContextAuthenticated
  ) {
    const userData = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.jwtPayload.userId
      }
    })

    const userQuery = new UserQuery(userData)
    const pswLimit = await userQuery.passwordLimit(ctx)
    const TOTPLimit = await userQuery.totpLimit(ctx)
    let pswCount = await ctx.prisma.encryptedSecret.count({
      where: {
        userId: ctx.jwtPayload.userId,
        kind: 'LOGIN_CREDENTIALS',
        deletedAt: null
      }
    })

    let TOTPCount = await ctx.prisma.encryptedSecret.count({
      where: {
        userId: ctx.jwtPayload.userId,
        kind: 'TOTP',
        deletedAt: null
      }
    })

    secrets.forEach((secret) => {
      if (secret.kind === 'LOGIN_CREDENTIALS') {
        pswCount++
      } else if (secret.kind === 'TOTP') {
        TOTPCount++
      }
    })

    console.log(pswCount, pswLimit, TOTPCount, TOTPLimit)
    if (pswCount > pswLimit) {
      console.log('psw exceeded')
      return new GraphqlError(`Password limit exceeded.`)
    }

    if (TOTPCount > TOTPLimit) {
      console.log('TOTP exceeded')
      return new GraphqlError(`TOTP limit exceeded.`)
    }
    return ctx.prisma.$transaction(
      // prisma.createMany cannot be used here https://github.com/prisma/prisma/issues/8131
      secrets.map((secret) =>
        ctx.prisma.encryptedSecret.create({
          data: {
            version: 1,
            userId: this.id,
            ...secret
          }
        })
      )
    )
  }

  @Field(() => DeviceGQL)
  async updateFireToken(
    @Arg('firebaseToken', () => String) firebaseToken: string,
    @Ctx() ctx: IContext
  ) {
    if (!this.masterDeviceId) {
      throw new Error('Must have masterDeviceId')
    }
    return ctx.prisma.device.update({
      data: {
        firebaseToken: firebaseToken
      },
      where: {
        id: this.masterDeviceId
      }
    })
  }

  @Field(() => UserGQL)
  async updateSettings(
    @Arg('config', () => SettingsInput) config: SettingsInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    return await ctx.prisma.user.update({
      where: {
        id: this.id
      },
      data: {
        autofill: config.autofill,
        language: config.language,
        theme: config.theme,
        Devices: {
          update: {
            where: {
              id: ctx.device.id
            },
            data: {
              syncTOTP: config.syncTOTP,
              vaultLockTimeoutSeconds: config.vaultLockTimeoutSeconds
            }
          }
        }
      }
    })
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
      let verification = await ctx.prisma.emailVerification.findFirst({
        where: {
          address: this.email
        }
      })

      if (!verification) {
        verification = await ctx.prisma.emailVerification.create({
          data: {
            token: uuidv4(),
            address: this.email,
            userId: this.id,
            kind: EmailVerificationType.PRIMARY
          }
        })
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
    return ctx.prisma.user.update({
      data: {
        tokenVersion: {
          increment: 1
        }
      },
      where: {
        id: this.id
      }
    })
  }

  @Field(() => GraphQLPositiveInt)
  async changeMasterPassword(
    @Arg('input', () => ChangeMasterPasswordInput)
    input: ChangeMasterPasswordInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    const secretsUpdates = input.secrets.map(({ id, ...patch }) => {
      return ctx.prisma.encryptedSecret.update({
        where: { id: id },
        data: patch
      })
    })

    await ctx.prisma.$transaction([
      ...secretsUpdates,
      ctx.prisma.user.update({
        data: {
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted
        },
        where: {
          id: this.id
        }
      }),
      ctx.prisma.decryptionChallenge.updateMany({
        where: {
          id: input.decryptionChallengeId,
          deviceId: ctx.jwtPayload.deviceId,
          userId: this.id
        },
        data: { masterPasswordVerifiedAt: new Date() }
      })
    ])
    return secretsUpdates.length
  }

  @Field(() => DecryptionChallengeMutation)
  async decryptionChallenge(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('id', () => Int) id: number
  ) {
    return ctx.prisma.decryptionChallenge.findFirst({
      where: {
        id,
        userId: ctx.jwtPayload.userId
      }
    })
  }

  @Field(() => MasterDeviceChangeGQL)
  async setMasterDevice(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('newMasterDeviceId', () => String) newMasterDeviceId: string
  ) {
    if (ctx.device.id !== ctx.masterDeviceId) {
      throw new GraphqlError('This can be done only from master device')
    }
    return ctx.prisma.user.update({
      where: {
        id: ctx.jwtPayload.userId
      },
      data: {
        masterDeviceId: newMasterDeviceId,
        MasterDeviceChange: {
          create: {
            oldDeviceId: ctx.masterDeviceId,
            newDeviceId: newMasterDeviceId,
            processAt: new Date()
          }
        }
      }
    })
  }

  @Field(() => String)
  async createPortalSession(@Ctx() ctx: IContextAuthenticated) {
    const product = await ctx.prisma.userPaidProducts.findFirst({
      where: {
        userId: ctx.jwtPayload.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!product) {
      throw new GraphqlError("You don't have a paid subscription")
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      product?.checkoutSessionId as string
    )

    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = `${process.env.FRONTEND_URL}/pricing`

    const portalSession = await stripe.billingPortal.sessions.create({
      email: this.email,
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
    const user = await ctx.prisma.userPaidProducts.findFirst({
      where: { userId: ctx.jwtPayload.userId }
    })

    const productItem = await stripe.products.retrieve(product)

    if (user) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        user?.checkoutSessionId as string
      )

      const session = await stripe.checkout.sessions.create({
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
      const session = await stripe.checkout.sessions.create({
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
        mode: 'subscription',
        success_url: `${ctx.request.headers.referer}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.request.headers.referer}?canceled=true`
      })

      return session.id
    }
  }
}
