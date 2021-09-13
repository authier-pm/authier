import 'reflect-metadata'
import fastify from 'fastify'
import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import dotenv from 'dotenv'
import cookie, { FastifyCookieOptions } from 'fastify-cookie'
import { prisma } from './prisma'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'
import { verify } from 'jsonwebtoken'
import chalk from 'chalk'
import { IContext } from './RootResolver'
import { captureException, init as sentryInit } from '@sentry/node'
import { GraphqlError } from './api/GraphqlError'

import pkg from '../package.json'
dotenv.config()

sentryInit({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `<project-name>@${pkg.version}`
})

const { env } = process
async function main() {
  const app = fastify({
    logger: true
  })
  app.register(require('fastify-cors'))
  app.post('/refresh_token', async (request, reply) => {
    const refreshToken = request.cookies['refresh-token']

    if (!refreshToken) {
      return reply.send({ ok: false, accessToken: '' })
    }

    let payload: any = null
    try {
      payload = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!)
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

    setNewRefreshToken(user, ctx)

    const accessToken = setNewAccessTokenIntoCookie(user, ctx)

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
        console.log(chalk.bgRed('Graphql errors: '))
        res.errors.map((err) => {
          if (err instanceof GraphqlError === false) {
            captureException(err)
          }
          console.error(' ', err)
        })
      }
      const errResponse = mercurius.defaultErrorFormatter(res, null)
      errResponse.statusCode = 200 // mercurius returns 500 by default, but we want to use 200 as that aligns better with apollo-server
      return errResponse
    }
  })

  app.listen(process.env.PORT!, '0.0.0.0')
}

main().then(() => {
  console.log(`Listening on ${process.env.PORT}`)
})
