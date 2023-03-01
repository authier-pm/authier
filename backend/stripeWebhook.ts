import { FastifyRequest } from 'fastify'
import { prismaClient } from './prisma/prismaClient'
import { stripe } from './stripe'
import { app, endpointSecret } from './app'

const CREDS_SUBSCRIPTION_ID = 'prod_LquWXgjk6kl5sM'
const TOTP_SUBSCRIPTION_ID = 'prod_LquVrkwfsXjTAL'
const TOTP_AND_CREDS_SUBSCRIPTION_ID = 'prod_Lp3NU9UcNWduBm'
const CREDS_SUBSCRIPTION = 60
const TOTP_SUBSCRIPTION = 20

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

    let event: { type: any; data: { object: any } }

    try {
      event = stripe.webhooks.constructEvent(
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
        subscription = event.data.object
        status = subscription.status
        if (status === 'canceled') {
          const session = event.data.object
          const productId = session.metadata.productId

          await prismaClient.$transaction(async () => {
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
          })

          if (productId === TOTP_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                TOTPlimit: {
                  decrement: 20
                }
              }
            })
          } else if (productId === CREDS_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                loginCredentialsLimit: {
                  decrement: 60
                }
              }
            })
          } else if (productId === TOTP_AND_CREDS_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                TOTPlimit: {
                  decrement: 20
                },
                loginCredentialsLimit: {
                  decrement: 60
                }
              }
            })
          }
        }
        console.log(`Subscription status is ${status}.`)
        break

      case 'checkout.session.completed':
        const session = event.data.object
        console.log('Session completed:', session.metadata)
        const productId = session.metadata.productId

        await prismaClient.$transaction(async () => {
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

          if (productId === TOTP_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                TOTPlimit: {
                  increment: TOTP_SUBSCRIPTION
                }
              }
            })
          } else if (productId === CREDS_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                loginCredentialsLimit: {
                  increment: CREDS_SUBSCRIPTION
                }
              }
            })
          } else if (productId === TOTP_AND_CREDS_SUBSCRIPTION_ID) {
            await prismaClient.user.update({
              where: {
                email: session.customer_details.email
              },
              data: {
                TOTPlimit: {
                  increment: TOTP_SUBSCRIPTION
                },
                loginCredentialsLimit: {
                  increment: CREDS_SUBSCRIPTION
                }
              }
            })
          }
        })

        break
      default:
        console.log(`Unhandled event type ${event.type}.`)
    }

    //Return a 200 response to acknowledge receipt of the event
    reply.send()
  })
  done()
}
