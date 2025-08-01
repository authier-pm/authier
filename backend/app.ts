import 'reflect-metadata'
import fastify from 'fastify'

import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import 'dotenv/config'

import type { FastifyCookieOptions } from '@fastify/cookie'
import cookie from '@fastify/cookie'
import { prismaClient } from './prisma/prismaClient'
import type { jwtPayloadRefreshToken } from './userAuth'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'
import { verify } from 'jsonwebtoken'
import type { IContext } from './models/types/ContextTypes'
import { captureException, init as sentryInit } from '@sentry/node'
import { GraphqlError } from './lib/GraphqlError'

import debug from 'debug'

import pkg from '../package.json'
import { healthReportHandler } from './healthReportRoute'
import fastifyCors from '@fastify/cors'
import { stripeWebhook } from './stripeWebhook'

const { env } = process
const log = debug('au:app')

const environment = env.NODE_ENV
sentryInit({
  dsn: env.SENTRY_DSN,
  environment,
  release: `<project-name>@${pkg.version}`
})

const isLambda = !!env.LAMBDA_TASK_ROOT

let logger
let pino
if (!isLambda) {
  ;(async () => {
    pino = await import('pino').then((m) => m.pino)
    logger = pino({
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
  })()
}

export const app = fastify({
  logger: logger
})

if (!isLambda) {
  app.register(fastifyCors, {
    origin: true,
    credentials: true
  })
}

app.setErrorHandler(async (error, request, reply) => {
  // Logging locally
  console.error(error)
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
  url: '/health',
  handler: (_request, reply) => {
    reply.send({ ok: true })
  }
})
app.route({
  method: 'GET',
  url: '/health/report',
  handler: healthReportHandler
})

app.register(stripeWebhook)

app.post('/refresh_token', async (request, reply) => {
  const refreshToken = request.cookies['refresh-token']

  if (!refreshToken) {
    return reply
      .status(400)
      .send({ ok: false, error: 'no refresh token cookie' })
  }

  let payload: jwtPayloadRefreshToken | null = null
  try {
    payload = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as jwtPayloadRefreshToken
  } catch (err: any) {
    console.log(err)
    return reply
      .clearCookie('refresh-token')
      .status(401)
      .send({ ok: false, error: err.message })
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

  const device = await prismaClient.device.findFirstOrThrow({
    where: {
      id: payload.deviceId
    }
  })
  const ctx = { request, reply } as IContext

  setNewRefreshToken(user, device, ctx)

  const accessToken = setNewAccessTokenIntoCookie(user, device, ctx)

  return reply.send({
    ok: true,
    accessToken
  })
})

app.register(mercurius, {
  schema: gqlSchema,
  graphiql: true,
  context: (request, reply) => {
    const getIpAddress = () => {
      return request.headers['x-forwarded-for'] || request.socket.remoteAddress
    }
    // @ts-expect-error
    if (request.body?.operationName) {
      // @ts-expect-error
      log(request.body?.operationName, request.body?.variables ?? '')
    }

    return { request, reply, getIpAddress, prisma: prismaClient }
  },
  errorFormatter: (res, ctx) => {
    // console.error(ctx)
    if (res.errors) {
      res.errors.forEach((err) => {
        if (err instanceof GraphqlError === false) {
          captureException(err)
        }
        ctx.app.log.error(err)
        console.error(err)
      })
    }
    const errResponse = mercurius.defaultErrorFormatter(res, ctx)
    errResponse.statusCode = 200 // mercurius returns 500 by default, but we want to use 200 as that aligns better with apollo-server
    return errResponse
  }
})
