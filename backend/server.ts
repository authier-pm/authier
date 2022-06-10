import 'reflect-metadata'
import fastify from 'fastify'
import fastifyHelmet from 'fastify-helmet'
import fastifyCors from '@fastify/cors'
import underPressure from 'under-pressure'
import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import './dotenv'

import cookie, { FastifyCookieOptions } from 'fastify-cookie'
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
import rawBody from 'fastify-raw-body'
import { UnauthorizedError } from 'type-graphql'

const { env } = process
const log = debug('au:server')

const environment = env.NODE_ENV
sentryInit({
  dsn: env.SENTRY_DSN,
  environment,
  release: `<project-name>@${pkg.version}`
})

const endpointSecret =
  'whsec_a5f8e80deb9a6c6aa46646127601e0788905dd1b956c3e2a1021e8b5884a7a68'

async function main() {
  const app = fastify({
    logger: {
      prettyPrint:
        environment === 'production'
          ? false
          : {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname'
            }
    }
  })

  await app.register(rawBody, {
    field: 'rawBody', // change the default request.rawBody property name
    global: true, // add the rawBody to every request. **Default true**
    encoding: false, // set it to false to set rawBody as a Buffer **Default utf8**
    runFirst: true, // get the body before any preParsing hook change/uncompress it. **Default false**
    routes: [] // array of routes, **`global`** will be ignored, wildcard routes not supported
  })

  app.setErrorHandler(async (error, request, reply) => {
    // Logging locally
    console.log(error)
    // Sending error to be logged in Sentry
    captureException(error)
    reply.status(500).send({ error: 'Something went wrong' })
  })

  app.register(fastifyCors, {
    origin: true,
    credentials: true
  })
  // const trustedDomains = ['https://unpkg.com']

  // app.register(fastifyHelmet, {
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"].concat(
  //         trustedDomains
  //       ),

  //       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"].concat(
  //         trustedDomains
  //       ),
  //       styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"].concat(
  //         trustedDomains
  //       )
  //     }
  //   }
  // })
  app.register(underPressure, {
    maxEventLoopDelay: 1000,
    retryAfter: 50,
    exposeStatusRoute: true
  })
  app.route({
    method: 'GET',
    url: '/health/report',
    handler: healthReportHandler
  })

  app.post('/webhook', {
    config: {
      //add the rawBody to this route. if false, rawBody will be disabled when global is true
      rawBody: true
    },
    handler(req, reply) {
      const sig = req.headers['stripe-signature']

      let event

      try {
        stripe.webhooks.constructEvent(req.rawBody!, sig!, endpointSecret)
      } catch (err) {
        console.log(err)
        reply.status(400).send(`Webhook Error: ${err.message}`)
        return
      }

      //Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object
          console.log('TEST', paymentIntent)
          //Then define and call a function to handle the event payment_intent.succeeded
          break
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`)
      }

      //Return a 200 response to acknowledge receipt of the event
      reply.send()
    }
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

  app.register(cookie, {
    secret: process.env.COOKIE_SECRET, // for cookies signature
    parseOptions: {} // options for parsing cookies
  } as FastifyCookieOptions)

  app.register(mercurius, {
    // errorHandler: (err, ctx) => {
    //   console.error(err)
    //   return err
    // },
    schema: gqlSchema,
    graphiql: true,
    context: (request, reply) => {
      const getIpAddress = () => {
        return (
          request.headers['x-forwarded-for'] || request.socket.remoteAddress
        )
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

  console.log(process.env.PORT)
  app.listen({ host: '0.0.0.0', port: process.env.PORT as unknown as number })
}

main().then(() => {
  console.log(`Listening on ${process.env.PORT}`)
  if (environment === 'development') {
    import('./scripts/generateGqlSchemas')
  }
})
