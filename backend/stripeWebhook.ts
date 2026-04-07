import type { LegacyRequest } from './lib/createLegacyHttpAdapters'
import { db } from './prisma/prismaClient'
import { createStripeClientGetter } from './stripeClient'

import { GraphQLError } from 'graphql'
import type Stripe from 'stripe'
import debug from 'debug'
import { eq, sql } from 'drizzle-orm'
import * as schema from './drizzle/schema'

const STRIPE_ENV = (process.env.STRIPE_ENV as 'test' | 'live') ?? 'live'

const stripeProducts = {
  test: {
    Credentials: 'prod_LquWXgjk6kl5sM',
    TOTP: 'prod_LquVrkwfsXjTAL',
    TOTPCredentials: 'prod_Lp3NU9UcNWduBm'
  },
  live: {
    Credentials: 'prod_O70NGKoIusmxwE',
    TOTP: 'prod_O70Pl3a3CW9XNz',
    TOTPCredentials: 'prod_O7KTrrFYqhOrJR'
  }
}
const log = debug('au:stripeWebhook')
export const endpointSecret = process.env.STRIPE_ENDPOINT as string

log('endpointSecret', endpointSecret)

const CREDS_SUBSCRIPTION_INCREASE = 250
const TOTP_SUBSCRIPTION_INCREASE = 100

interface WebhookReply {
  status: (code: number) => {
    send: (payload?: unknown) => unknown
  }
  send: (payload?: unknown) => unknown
}

export const webhookHandler = async (
  req: Pick<LegacyRequest, 'headers' | 'body'>,
  reply: WebhookReply
) => {
  const stripeClient = createStripeClientGetter()()
  const sig = req.headers['stripe-signature']

  let event: Stripe.Event

  if (!sig) {
    reply.status(400).send('Webhook Error: Missing stripe-signature header')
    return
  }

  const rawBody = (req.body as { raw?: string } | undefined)?.raw

  if (!rawBody) {
    reply.status(400).send('Webhook Error: Missing raw request body')
    return
  }

  event = stripeClient.webhooks.constructEvent(rawBody, sig, endpointSecret)

  log('event', event)

  let subscription: { status: string }
  let status: string

  async function incrementAccountLimits(
    session: {
      id: string
      customer_details?: { email?: string }
      expires_at?: number
      metadata?: { productId?: string }
    },
    productId: string
  ) {
    const userEmail = session.customer_details?.email
    if (!userEmail) return

    // Find user by email
    const foundUser = await db.query.user.findFirst({
      where: { email: userEmail },
      columns: { id: true }
    })
    if (!foundUser) return

    // Insert paid product record
    await db.insert(schema.userPaidProducts).values({
      checkoutSessionId: session.id,
      productId,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : null,
      userId: foundUser.id
    })

    if (productId === stripeProducts[STRIPE_ENV].TOTP) {
      await db
        .update(schema.user)
        .set({
          TOTPlimit: sql`${schema.user.TOTPlimit} + ${TOTP_SUBSCRIPTION_INCREASE}`
        })
        .where(eq(schema.user.email, userEmail))
    } else if (productId === stripeProducts[STRIPE_ENV].Credentials) {
      await db
        .update(schema.user)
        .set({
          loginCredentialsLimit: sql`${schema.user.loginCredentialsLimit} + ${CREDS_SUBSCRIPTION_INCREASE}`
        })
        .where(eq(schema.user.email, userEmail))
    } else if (productId === stripeProducts[STRIPE_ENV].TOTPCredentials) {
      await db
        .update(schema.user)
        .set({
          TOTPlimit: sql`${schema.user.TOTPlimit} + ${TOTP_SUBSCRIPTION_INCREASE}`,
          loginCredentialsLimit: sql`${schema.user.loginCredentialsLimit} + ${CREDS_SUBSCRIPTION_INCREASE}`
        })
        .where(eq(schema.user.email, userEmail))
    }
  }

  const session = event.data.object as {
    id: string
    customer_details?: { email?: string }
    expires_at?: number
    metadata?: { productId?: string }
    status?: string
  }
  const productId = session.metadata?.productId ?? ''

  switch (event.type) {
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
      subscription = event.data.object as { status: string }
      status = subscription.status
      if (status === 'canceled') {
        const userEmail = session.customer_details?.email
        if (userEmail) {
          // Delete the paid product record
          await db
            .delete(schema.userPaidProducts)
            .where(eq(schema.userPaidProducts.productId, productId))

          // Decrement the appropriate limits
          if (productId === stripeProducts[STRIPE_ENV].TOTP) {
            await db
              .update(schema.user)
              .set({
                TOTPlimit: sql`${schema.user.TOTPlimit} - ${TOTP_SUBSCRIPTION_INCREASE}`
              })
              .where(eq(schema.user.email, userEmail))
          } else if (productId === stripeProducts[STRIPE_ENV].Credentials) {
            await db
              .update(schema.user)
              .set({
                loginCredentialsLimit: sql`${schema.user.loginCredentialsLimit} - ${CREDS_SUBSCRIPTION_INCREASE}`
              })
              .where(eq(schema.user.email, userEmail))
          } else if (productId === stripeProducts[STRIPE_ENV].TOTPCredentials) {
            await db
              .update(schema.user)
              .set({
                TOTPlimit: sql`${schema.user.TOTPlimit} - ${TOTP_SUBSCRIPTION_INCREASE}`,
                loginCredentialsLimit: sql`${schema.user.loginCredentialsLimit} - ${CREDS_SUBSCRIPTION_INCREASE}`
              })
              .where(eq(schema.user.email, userEmail))
          }
        }
      }
      console.log(`Subscription status is ${status}.`)
      break

    case 'customer.subscription.resumed':
      await incrementAccountLimits(session, productId)
      break
    case 'checkout.session.completed':
      console.log('Session completed:', session)
      await incrementAccountLimits(session, productId)
      break
    default:
      console.log(`Unhandled event type ${event.type}.`)
  }

  reply.send()
}
