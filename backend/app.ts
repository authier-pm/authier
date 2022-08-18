import 'reflect-metadata'
import fastify, { FastifyRequest } from 'fastify'

import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import './dotenv'
import pino from 'pino'

import cookie, { FastifyCookieOptions } from '@fastify/cookie'
import { prismaClient } from './prisma/prismaClient'
import {
  jwtPayloadRefreshToken,
  setNewAccessTokenIntoCookie,
  setNewRefreshToken
} from './userAuth'
import { verify } from 'jsonwebtoken'
import { IContext } from './schemas/RootResolver'
import { captureException, init as sentryInit } from '@sentry/node'
import { GraphqlError } from './api/GraphqlError'
import * as admin from 'firebase-admin'
import serviceAccount from './authier-bc184-firebase-adminsdk-8nuxf-4d2cc873ea.json'
import debug from 'debug'

import pkg from '../package.json'
import { healthReportHandler } from './healthReportRoute'
import { stripe } from './stripe'
import fastifyCors from '@fastify/cors'

const { env } = process
const log = debug('au:server')

const environment = env.NODE_ENV
sentryInit({
  dsn: env.SENTRY_DSN,
  environment,
  release: `<project-name>@${pkg.version}`
})

const endpointSecret = env.STRIPE_ENDPOINT_SECRET_TEST_MODE as string
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore:
        environment === 'production' ? 'pid,hostname,time' : 'pid,hostname',
      colorize: true
    }
  }
})

export const app = fastify({
  logger
})

app.register(fastifyCors, {
  origin: true,
  credentials: true
})

app.setErrorHandler(async (error, request, reply) => {
  // Logging locally
  console.log(error)
  // Sending error to be logged in Sentry
  captureException(error)
  reply.status(500).send({ error: 'Something went wrong' })
})

app.register(cookie, {
  secret: process.env.COOKIE_SECRET, // for cookies signature
  parseOptions: {} // options for parsing cookies
} as FastifyCookieOptions)

app.route({
  method: 'GET',
  url: '/health/report',
  handler: healthReportHandler
})

app.register((fastify, opts, done) => {
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

    let event

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

    let subscription
    let status

    //Handle the event
    switch (event.type) {
      case 'customer.subscription.deleted':
        subscription = event.data.object
        status = subscription.status
        console.log(`Subscription status is ${status}.`)
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break

      case 'checkout.session.completed':
        const session = event.data.object
        console.log(session)
        await prismaClient.user.update({
          where: {
            email: session.customer_details.email
          },
          data: {
            UserPaidProducts: {
              create: {
                checkoutSessionId: session.id,
                productId: session.subscription,
                expiresAt: new Date(session.expires_at)
              }
            }
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
})

app.post('/refresh_token', async (request, reply) => {
  const refreshToken = request.cookies['refresh-token']

  if (!refreshToken) {
    return reply.send({ ok: false, accessToken: '' })
  }

  let payload: jwtPayloadRefreshToken | null = null
  try {
    payload = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as jwtPayloadRefreshToken
  } catch (err) {
    console.log(err)
    return reply
      .clearCookie('refresh-token')
      .send({ ok: false, accessToken: '' })
  }

  //token is valid and we can send back access token
  const user = await prismaClient.user.findUnique({
    where: {
      id: payload.userId
    }
  })

  if (!user) {
    return reply.send({ ok: false, accessToken: '' })
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    return reply.send({ ok: false, accessToken: '' })
  }
  const ctx = { request, reply } as IContext

  setNewRefreshToken(user, payload.deviceId, ctx)

  const accessToken = setNewAccessTokenIntoCookie(user, payload.deviceId, ctx)

  return reply.send({
    ok: true,
    accessToken
  })
})

app.register(mercurius, {
  // errorHandler: (err, ctx) => {
  //   console.error(err)
  //   return err
  // },
  schema: gqlSchema,
  graphiql: true,
  context: (request, reply) => {
    const getIpAddress = () => {
      return request.headers['x-forwarded-for'] || request.socket.remoteAddress
    }
    log('body: ', request.body)

    return { request, reply, getIpAddress, prisma: prismaClient }
  },
  errorFormatter: (res, ctx) => {
    if (res.errors) {
      res.errors.map((err) => {
        if (err instanceof GraphqlError === false) {
          captureException(err)
        }
        // @ts-expect-error
        ctx.request.log.error(err)
      })
    }
    const errResponse = mercurius.defaultErrorFormatter(res, ctx)
    errResponse.statusCode = 200 // mercurius returns 500 by default, but we want to use 200 as that aligns better with apollo-server
    return errResponse
  }
})
admin.initializeApp({
  //@ts-expect-error TODO: fix this
  credential: admin.credential.cert(serviceAccount)
})
