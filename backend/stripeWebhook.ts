import { FastifyRequest } from 'fastify'
import { prismaClient, prismaTransaction } from './prisma/prismaClient'
import { stripeClient } from './stripeClient'

import { endpointSecret } from './app'
import { GraphQLError } from 'graphql'
import Stripe from 'stripe'

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

const CREDS_SUBSCRIPTION_INCREASE = 250
const TOTP_SUBSCRIPTION_INCREASE = 100

export const stripeWebhook = (fastify, opts, done) => {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    function (req, body, done) {
      try {
        const newBody = {
          raw: body,
          parsed: JSON.parse(body as string)
        }
        done(null, newBody)
      } catch (error: any) {
        error.statusCode = 400
        done(error, undefined)
      }
    }
  )
  fastify.post('/webhook', async (req: FastifyRequest, reply) => {
    const sig = req.headers['stripe-signature']

    let event: Stripe.Event

    try {
      event = stripeClient.webhooks.constructEvent(
        //@ts-expect-error TODO @capaj
        req.body.raw,
        sig as string | string[] | Buffer,
        endpointSecret
      )
    } catch (err: any) {
      reply.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    let subscription: { status: string }
    let status: string

    //Handle the event
    switch (event.type) {
      case 'customer.subscription.deleted':
        // Then define and call a method to handle the subscription deleted.
        subscription = event.data.object as any // TODO type properly
        status = subscription.status
        if (status === 'canceled') {
          const session = event.data.object as any //
          const productId = session.metadata?.productId

          await prismaTransaction(async () => {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                UserPaidProducts: {
                  delete: {
                    id: productId,
                    expiresAt: session.expires_at
                  }
                }
              }
            })

            if (productId === stripeProducts[STRIPE_ENV].TOTP) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  TOTPlimit: {
                    decrement: TOTP_SUBSCRIPTION_INCREASE
                  }
                }
              })
            } else if (productId === stripeProducts[STRIPE_ENV].Credentials) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  loginCredentialsLimit: {
                    decrement: CREDS_SUBSCRIPTION_INCREASE
                  }
                }
              })
            } else if (
              productId === stripeProducts[STRIPE_ENV].TOTPCredentials
            ) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  TOTPlimit: {
                    decrement: TOTP_SUBSCRIPTION_INCREASE
                  },
                  loginCredentialsLimit: {
                    decrement: CREDS_SUBSCRIPTION_INCREASE
                  }
                }
              })
            }
          })
        }
        console.log(`Subscription status is ${status}.`)
        break

      case 'checkout.session.completed':
        const session = event.data.object as any

        console.log('Session completed:', session)
        const productId = session.metadata.productId

        try {
          await prismaTransaction(async () => {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                UserPaidProducts: {
                  create: {
                    checkoutSessionId: session.id,
                    productId,
                    expiresAt: new Date(session.expires_at)
                  }
                }
              }
            })

            if (productId === stripeProducts[STRIPE_ENV].TOTP) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  TOTPlimit: {
                    increment: TOTP_SUBSCRIPTION_INCREASE
                  }
                }
              })
            } else if (productId === stripeProducts[STRIPE_ENV].Credentials) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  loginCredentialsLimit: {
                    increment: CREDS_SUBSCRIPTION_INCREASE
                  }
                }
              })
            } else if (
              productId === stripeProducts[STRIPE_ENV].TOTPCredentials
            ) {
              await prismaClient.user.update({
                where: {
                  email: session.customer_details.email
                },
                data: {
                  TOTPlimit: {
                    increment: TOTP_SUBSCRIPTION_INCREASE
                  },
                  loginCredentialsLimit: {
                    increment: CREDS_SUBSCRIPTION_INCREASE
                  }
                }
              })
            }
          })
        } catch (error) {
          console.error(error)
          throw new GraphQLError('Error completing checkout session')
        }

        break
      default:
        console.log(`Unhandled event type ${event.type}.`)
    }

    //Return a 200 response to acknowledge receipt of the event
    reply.send()
  })
  done()
}
