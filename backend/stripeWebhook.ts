import type { LegacyRequest } from './lib/createLegacyHttpAdapters'
import { db } from './prisma/prismaClient'
import { createStripeClientGetter } from './stripeClient'

import { GraphQLError } from 'graphql'
import type Stripe from 'stripe'
import debug from 'debug'
import { and, eq, sql } from 'drizzle-orm'
import * as schema from './drizzle/schema'
import { defaultAccountLimits } from './models/accountLimits'

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

const CREDS_SUBSCRIPTION_INCREASE = 250
const TOTP_SUBSCRIPTION_INCREASE = 100

const knownProductIds = new Set(Object.values(stripeProducts.test).concat(Object.values(stripeProducts.live)))

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

  event = (() => {
    try {
      return stripeClient.webhooks.constructEvent(
        rawBody,
        sig,
        endpointSecret
      )
    } catch (error) {
      log('Webhook signature verification failed', error)
      reply.status(400).send('Webhook Error: Invalid signature')
      return null as unknown as Stripe.Event
    }
  })()
  if (!event) return

  log('event', event)

  async function incrementAccountLimits(
    session: {
      id: string
      customer_details?: { email?: string } | null
      expires_at?: number
      metadata?: { productId?: string } | null
    },
    productId: string
  ) {
    if (!knownProductIds.has(productId)) return
    const userEmail = session.customer_details?.email
    if (!userEmail) return

    // Idempotency: Stripe retries `checkout.session.completed`, and replays
    // must not double-increment limits.
    const existing = await db.query.userPaidProducts.findFirst({
      where: { checkoutSessionId: session.id },
      columns: { id: true }
    })
    if (existing) return

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

  async function decrementAccountLimits(
    userId: string,
    userEmail: string,
    productId: string
  ) {
    if (!knownProductIds.has(productId)) return

    // Scope the delete to this user: a global `where productId = ?` would
    // wipe every subscriber's row for that product.
    await db
      .delete(schema.userPaidProducts)
      .where(
        and(
          eq(schema.userPaidProducts.userId, userId),
          eq(schema.userPaidProducts.productId, productId)
        )
      )

    // Clamp at free-tier defaults so duplicate/legacy cancel events cannot
    // drive limits negative.
    if (productId === stripeProducts[STRIPE_ENV].TOTP) {
      await db
        .update(schema.user)
        .set({
          TOTPlimit: sql`GREATEST(${defaultAccountLimits.TOTPlimit}, ${schema.user.TOTPlimit} - ${TOTP_SUBSCRIPTION_INCREASE})`
        })
        .where(eq(schema.user.email, userEmail))
    } else if (productId === stripeProducts[STRIPE_ENV].Credentials) {
      await db
        .update(schema.user)
        .set({
          loginCredentialsLimit: sql`GREATEST(${defaultAccountLimits.loginCredentialsLimit}, ${schema.user.loginCredentialsLimit} - ${CREDS_SUBSCRIPTION_INCREASE})`
        })
        .where(eq(schema.user.email, userEmail))
    } else if (productId === stripeProducts[STRIPE_ENV].TOTPCredentials) {
      await db
        .update(schema.user)
        .set({
          TOTPlimit: sql`GREATEST(${defaultAccountLimits.TOTPlimit}, ${schema.user.TOTPlimit} - ${TOTP_SUBSCRIPTION_INCREASE})`,
          loginCredentialsLimit: sql`GREATEST(${defaultAccountLimits.loginCredentialsLimit}, ${schema.user.loginCredentialsLimit} - ${CREDS_SUBSCRIPTION_INCREASE})`
        })
        .where(eq(schema.user.email, userEmail))
    }
  }

  // `customer.subscription.*` events carry a Subscription object, NOT a
  // Checkout Session: there is no `customer_details.email`. Resolve the user
  // via the Stripe customer, and the products via the subscription items
  // (plus metadata fallback).
  async function handleSubscriptionCancelled(
    subscription: Stripe.Subscription
  ) {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id
    if (!customerId) return

    let customerEmail: string | undefined
    try {
      const customer = await stripeClient.customers.retrieve(customerId)
      if (!customer.deleted) {
        customerEmail = customer.email ?? undefined
      }
    } catch (error) {
      log('Failed to retrieve Stripe customer', customerId, error)
      return
    }
    if (!customerEmail) return

    const foundUser = await db.query.user.findFirst({
      where: { email: customerEmail },
      columns: { id: true, email: true }
    })
    if (!foundUser?.email) return

    const productIds = new Set<string>()
    const items = subscription.items?.data ?? []
    for (const item of items) {
      const product = item.price?.product
      const productId =
        typeof product === 'string' ? product : product?.id
      if (productId && knownProductIds.has(productId)) {
        productIds.add(productId)
      }
    }
    const metadataProductId = subscription.metadata?.productId
    if (metadataProductId && knownProductIds.has(metadataProductId)) {
      productIds.add(metadataProductId)
    }
    // Fallback: if the subscription payload carries no product reference
    // (e.g. metadata was set on the checkout session only), decrement
    // whatever paid rows this user still holds so cancel actually revokes.
    if (productIds.size === 0) {
      const rows = await db.query.userPaidProducts.findMany({
        where: { userId: foundUser.id },
        columns: { productId: true }
      })
      for (const row of rows) {
        if (knownProductIds.has(row.productId)) {
          productIds.add(row.productId)
        }
      }
    }

    for (const productId of productIds) {
      await decrementAccountLimits(foundUser.id, foundUser.email, productId)
    }
  }

  switch (event.type) {
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionCancelled(subscription)
      console.log(`Subscription ${subscription.id} deleted.`)
      break
    }
    case 'customer.subscription.paused': {
      const subscription = event.data.object as unknown as {
        id?: string
        status?: string
      }
      // Only revoke when the pause is effectively a cancellation.
      if (subscription.status === 'canceled') {
        await handleSubscriptionCancelled(
          event.data.object as Stripe.Subscription
        )
      }
      console.log(`Subscription status is ${subscription.status}.`)
      break
    }

    case 'customer.subscription.resumed': {
      const session = event.data.object as {
        id: string
        customer_details?: { email?: string } | null
        expires_at?: number
        metadata?: { productId?: string } | null
      }
      await incrementAccountLimits(session, session.metadata?.productId ?? '')
      break
    }
    case 'checkout.session.completed': {
      const session = event.data.object as {
        id: string
        customer_details?: { email?: string } | null
        expires_at?: number
        metadata?: { productId?: string } | null
      }
      console.log('Session completed:', session.id)
      await incrementAccountLimits(session, session.metadata?.productId ?? '')
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}.`)
  }

  reply.send()
}
