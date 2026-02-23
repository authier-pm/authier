import 'reflect-metadata'

import { Elysia, serializeCookie } from 'elysia'
import { cors } from '@elysiajs/cors'
import { createYoga } from 'graphql-yoga'
import type { GraphQLError } from 'graphql'
import { gqlSchema } from './schemas/gqlSchema'
import { createRequestDb } from './prisma/prismaClient'
import { createStripeClientGetter } from './stripeClient'
import type { jwtPayloadRefreshToken } from './userAuth'
import { setNewAccessTokenIntoCookie, setNewRefreshToken } from './userAuth'
import { verify } from 'jsonwebtoken'
import type { IContext } from './models/types/ContextTypes'
import debug from 'debug'
import { healthReportHandler } from './healthReportRoute'
import { webhookHandler } from './stripeWebhook'
import * as schema from './drizzle/schema'
import { and, eq, isNull } from 'drizzle-orm'
import {
  type LegacyElysiaContext,
  createLegacyReplyAdapter,
  createLegacyRequestFromElysia
} from './lib/createLegacyHttpAdapters'

const log = debug('au:app')

type YogaServerContext = {
  legacyRequest: IContext['request']
  legacyReply: IContext['reply']
  getIpAddress: () => string
  getStripeClient: IContext['getStripeClient']
  requestDb: IContext['db']
}

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Symbol.asyncIterator in value &&
  typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function'

const attachGraphqlStacks = <T extends { errors?: readonly GraphQLError[] }>(
  result: T
) => {
  if (!result.errors?.length) return result

  for (const error of result.errors) {
    const maybeError = error as GraphQLError & {
      originalError?: Error
      stack?: string
    }
    const stack = maybeError.originalError?.stack ?? maybeError.stack
    if (!stack) continue

    const extensions = error.extensions as Record<string, unknown>

    extensions.stacktrace = stack.split('\n')
  }

  return result
}

const yoga = createYoga<YogaServerContext, IContext>({
  schema: gqlSchema,
  graphiql: true,
  graphqlEndpoint: '/graphql',
  cors: true,
  maskedErrors: false,
  plugins: [
    {
      onExecutionResult({ result, setResult }) {
        if (!result || isAsyncIterable(result)) return
        setResult(attachGraphqlStacks(result))
      }
    }
  ],
  context: ({
    params,
    legacyRequest,
    legacyReply,
    getIpAddress,
    getStripeClient,
    requestDb
  }) => {
    if (params.operationName) {
      log(params.operationName, params.variables ?? '')
    }

    return {
      request: legacyRequest,
      reply: legacyReply,
      getIpAddress,
      getStripeClient,
      db: requestDb
    }
  }
})

const copyYogaResponseToElysia = async (
  ctx: Pick<LegacyElysiaContext, 'set'>,
  response: Response
) => {
  const headers = new Headers(response.headers)

  for (const [key, value] of Object.entries(ctx.set.headers)) {
    if (value == null) continue
    if (key.toLowerCase() === 'set-cookie') continue

    headers.set(key, String(value))
  }

  const serializedCookies = serializeCookie(ctx.set.cookie)
  if (serializedCookies) {
    if (Array.isArray(serializedCookies)) {
      serializedCookies.forEach((cookie) =>
        headers.append('Set-Cookie', cookie)
      )
    } else {
      headers.append('Set-Cookie', serializedCookies)
    }
  }

  headers.delete('content-length')

  const body = response.body === null ? null : await response.arrayBuffer()

  return new Response(body, {
    status:
      typeof ctx.set.status === 'number' ? ctx.set.status : response.status,
    headers
  })
}

const getIpAddressFromLegacyRequest = (request: IContext['request']) => () => {
  return (
    request.headers['x-forwarded-for'] ??
    request.headers['cf-connecting-ip'] ??
    ''
  )
}

const handleGraphqlRequest = async (ctx: LegacyElysiaContext) => {
  const requestDb = createRequestDb()
  const getStripeClient = createStripeClientGetter()
  const legacyReply = createLegacyReplyAdapter(ctx)
  const legacyRequest = createLegacyRequestFromElysia(ctx)
  const getIpAddress = getIpAddressFromLegacyRequest(legacyRequest)

  try {
    const response = await yoga.handle(ctx.request, {
      legacyRequest,
      legacyReply,
      getIpAddress,
      getStripeClient,
      requestDb: requestDb.db
    })

    return await copyYogaResponseToElysia(ctx, response)
  } finally {
    await requestDb.close()
  }
}

export const buildApp = (app = new Elysia()) => {
  app
    .use(
      cors({
        origin: true,
        credentials: true
      })
    )
    .onError(({ code, error, set }) => {
      if (code === 'NOT_FOUND') return

      console.error(error)
      set.status = 500
      return { error: 'Something went wrong' }
    })
    .get('/health', () => ({ ok: true }))
    .get('/health/report', async (ctx) => {
      const reply = createLegacyReplyAdapter(ctx)
      await healthReportHandler(undefined, reply)
      return reply.getPayload()
    })
    .get('/confirm-master-device-reset', async ({ query, redirect }) => {
      const token =
        typeof query?.token === 'string' && query.token.length > 0
          ? query.token
          : null

      const frontendUrl = process.env.FRONTEND_URL ?? '/'
      const redirectWithStatus = (status: string) =>
        redirect(
          `${frontendUrl}/confirm-master-device-reset?status=${encodeURIComponent(status)}`
        )

      if (!token) {
        return redirectWithStatus('missing-token')
      }

      const requestDb = createRequestDb()
      try {
        const [resetRequest] = await requestDb.db
          .select({
            id: schema.masterDeviceResetRequest.id,
            completedAt: schema.masterDeviceResetRequest.completedAt,
            confirmedAt: schema.masterDeviceResetRequest.confirmedAt,
            rejectedAt: schema.masterDeviceResetRequest.rejectedAt
          })
          .from(schema.masterDeviceResetRequest)
          .where(eq(schema.masterDeviceResetRequest.confirmationToken, token))
          .limit(1)

        if (!resetRequest) {
          return redirectWithStatus('not-found')
        }

        if (resetRequest.completedAt) {
          return redirectWithStatus('already-completed')
        }

        if (resetRequest.rejectedAt) {
          return redirectWithStatus('rejected')
        }

        if (!resetRequest.confirmedAt) {
          await requestDb.db
            .update(schema.masterDeviceResetRequest)
            .set({
              confirmedAt: new Date()
            })
            .where(
              and(
                eq(schema.masterDeviceResetRequest.id, resetRequest.id),
                isNull(schema.masterDeviceResetRequest.completedAt),
                isNull(schema.masterDeviceResetRequest.rejectedAt),
                isNull(schema.masterDeviceResetRequest.confirmedAt)
              )
            )
        }

        return redirectWithStatus('confirmed')
      } finally {
        await requestDb.close()
      }
    })
    .get('/graphiql', ({ redirect }) => redirect('/graphql'))
    .get('/graphql', handleGraphqlRequest)
    .post('/graphql', handleGraphqlRequest, {
      parse: 'none'
    })
    .post(
      '/webhook',
      async (ctx) => {
        const rawBody = await ctx.request.text()
        const request = createLegacyRequestFromElysia(ctx, {
          body: {
            raw: rawBody
          }
        })
        const reply = createLegacyReplyAdapter(ctx)

        await webhookHandler(request, reply)

        return reply.getPayload()
      },
      {
        parse: 'none'
      }
    )
    .post('/refresh_token', async (ctx) => {
      const requestDb = createRequestDb()
      const getStripeClient = createStripeClientGetter()
      const request = createLegacyRequestFromElysia(ctx)
      const reply = createLegacyReplyAdapter(ctx)
      try {
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
        } catch (error) {
          console.log(error)

          const message =
            error instanceof Error ? error.message : 'invalid token'

          return reply
            .clearCookie('refresh-token')
            .status(401)
            .send({ ok: false, error: message })
        }

        const user = await requestDb.db.query.user.findFirst({
          where: { id: payload.userId }
        })

        if (!user) {
          return reply.send({ ok: false, accessToken: null })
        }

        if (user.tokenVersion !== payload.tokenVersion) {
          return reply.send({ ok: false, accessToken: null })
        }

        const device = await requestDb.db.query.device.findFirst({
          where: { id: payload.deviceId }
        })
        if (!device) throw new Error('Device not found')

        const legacyCtx: IContext = {
          request,
          reply,
          getIpAddress: getIpAddressFromLegacyRequest(request),
          getStripeClient,
          db: requestDb.db
        }

        setNewRefreshToken(user, device, legacyCtx)

        const accessToken = setNewAccessTokenIntoCookie(user, device, legacyCtx)

        return reply.send({
          ok: true,
          accessToken
        })
      } finally {
        await requestDb.close()
      }
    })

  return app
}

export const app = buildApp()
