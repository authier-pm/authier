import { ORPCError } from '@orpc/server'
import { verify } from 'jsonwebtoken'
import {
  createLegacyReplyAdapter,
  createLegacyRequestFromElysia
} from '../lib/createLegacyHttpAdapters'
import type { LegacyElysiaContext } from '../lib/createLegacyHttpAdapters'
import type {
  IContext,
  IContextAuthenticated,
  IJWTPayload
} from '../models/types/ContextTypes'
import { createRequestDb } from '../prisma/prismaClient'
import { createStripeClientGetter } from '../stripeClient'

export type OrpcContext = {
  legacyCtx: IContext
}

export const createOrpcRequestContext = (ctx: LegacyElysiaContext) => {
  const requestDb = createRequestDb()
  const request = createLegacyRequestFromElysia(ctx)
  const reply = createLegacyReplyAdapter(ctx)

  const legacyCtx: IContext = {
    request,
    reply,
    getIpAddress: () =>
      request.headers['x-forwarded-for'] ??
      request.headers['cf-connecting-ip'] ??
      '',
    getStripeClient: createStripeClientGetter(),
    db: requestDb.db
  }

  return {
    context: {
      legacyCtx
    } satisfies OrpcContext,
    close: requestDb.close
  }
}

const getAccessToken = (ctx: IContext) => {
  if (ctx.request.cookies['access-token']) {
    return ctx.request.cookies['access-token']
  }

  const authorization = ctx.request.headers['authorization']

  return authorization?.split(' ')[1]
}

export const loadAuthenticatedContextByIds = async (
  ctx: IContext,
  payload: IJWTPayload
): Promise<IContextAuthenticated> => {
  const currentDevice = await ctx.db.query.device.findFirst({
    where: { id: payload.deviceId }
  })

  if (!currentDevice || currentDevice.logoutAt) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  const user = await ctx.db.query.user.findFirst({
    where: { id: payload.userId },
    columns: {
      masterDeviceId: true
    }
  })

  if (!user) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  return {
    ...ctx,
    jwtPayload: payload,
    device: currentDevice,
    masterDeviceId: user.masterDeviceId
  }
}

export const requireAuthContext = async (
  ctx: IContext
): Promise<IContextAuthenticated> => {
  const token = getAccessToken(ctx)

  if (!token) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  let payload: IJWTPayload

  try {
    payload = verify(token, process.env.ACCESS_TOKEN_SECRET!) as IJWTPayload
  } catch {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  return loadAuthenticatedContextByIds(ctx, payload)
}
