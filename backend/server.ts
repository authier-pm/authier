import 'reflect-metadata'
import fastify from 'fastify'
import fastifyHelmet from 'fastify-helmet'
import fastifyCors from 'fastify-cors'
import underPressure from 'under-pressure'
import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import dotenv from 'dotenv'
import cookie, { FastifyCookieOptions } from 'fastify-cookie'
import { prisma } from './prisma'
import {
  jwtPayloadRefreshToken,
  setNewAccessTokenIntoCookie,
  setNewRefreshToken
} from './userAuth'
import { verify } from 'jsonwebtoken'
import chalk from 'chalk'
import { IContext } from './RootResolver'
import { captureException, init as sentryInit } from '@sentry/node'
import { GraphqlError } from './api/GraphqlError'
import * as admin from 'firebase-admin'
import serviceAccount from './authier-bc184-firebase-adminsdk-8nuxf-4d2cc873ea.json'
import debug from 'debug'

import pkg from '../package.json'
import { healthReportHandler } from './healthReportRoute'
dotenv.config()
const { env } = process
const log = debug('au:server')

const environment = env.NODE_ENV
sentryInit({
  dsn: env.SENTRY_DSN,
  environment,
  release: `<project-name>@${pkg.version}`
})

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
  app.register(fastifyCors)
  const trustedDomains = ['https://unpkg.com']
  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"].concat(
          trustedDomains
        ),
        styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"].concat(
          trustedDomains
        )
      }
    }
  })
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
    const user = await prisma.user.findUnique({
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
    schema: gqlSchema,
    graphiql: true,
    context: (request, reply) => {
      const getIpAddress = () => {
        return (
          request.headers['x-forwarded-for'] || request.socket.remoteAddress
        )
      }
      return { request, reply, getIpAddress }
    },
    errorFormatter: (res, ctx) => {
      if (res.errors) {
        log('body: ', ctx.request.body)

        res.errors.map((err) => {
          if (err instanceof GraphqlError === false) {
            captureException(err)
          }
          ctx.request.log.error(err)
        })
      }
      const errResponse = mercurius.defaultErrorFormatter(res, null)
      errResponse.statusCode = 200 // mercurius returns 500 by default, but we want to use 200 as that aligns better with apollo-server
      return errResponse
    }
  })

  admin.initializeApp({
    //@ts-expect-error
    credential: admin.credential.cert(serviceAccount)
  })

  app.listen(process.env.PORT!, '0.0.0.0')
}

main().then(() => {
  console.log(`Listening on ${process.env.PORT}`)
})
