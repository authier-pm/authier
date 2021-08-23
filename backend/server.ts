import { sendRefreshToken } from './sendRefreshToken'
import 'reflect-metadata'
import fastify from 'fastify'
import mercurius from 'mercurius'
import { gqlSchema } from './schemas/gqlSchema'
import dotenv from 'dotenv'
import cookie, { FastifyCookieOptions } from 'fastify-cookie'
import { prisma } from './prisma'
import { createAccessToken, createRefreshToken } from './auth'
import { verify } from 'jsonwebtoken'
import { UserBase } from './models/user'
import chalk from 'chalk'
dotenv.config()

const { env } = process
async function main() {
  const app = fastify({
    logger: true
  })

  app.post('/refresh_token', async (request, reply) => {
    const token = request.cookies.jid

    if (!token) {
      return reply.send({ ok: false, accessToken: '' })
    }

    let payload: any = null
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!)
    } catch (err) {
      console.log(err)
      return reply.send({ ok: false, accessToken: '' })
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

    sendRefreshToken(reply, createRefreshToken(user as UserBase))

    return reply.send({
      ok: true,
      accessToken: createAccessToken(user as UserBase)
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
      return { request, reply }
    },
    errorFormatter: (res, ctx) => {
      if (env.NODE_ENV === 'production') {
        return mercurius.defaultErrorFormatter(res, ctx)
      }
      if (res.errors) {
        console.log(chalk.bgRed('Graphql errors: '))
        res.errors.map((err) => {
          console.error(' ', err)
        })
      }
      return mercurius.defaultErrorFormatter(res, null)
    }
  })

  app.listen(process.env.PORT!, '0.0.0.0')
}

main().then(() => {
  console.log(`Listening on ${process.env.PORT}`)
})
