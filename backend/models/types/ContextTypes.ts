import type {
  LegacyReply,
  LegacyRequest
} from '../../lib/createLegacyHttpAdapters'
import type Stripe from 'stripe'
import type { db } from '../../prisma/prismaClient'
import * as dbSchema from '../../drizzle/schema'
import type { InferSelectModel } from 'drizzle-orm'
export type Device = InferSelectModel<typeof dbSchema.device>

export interface IContext {
  request: LegacyRequest
  reply: LegacyReply
  getIpAddress: () => string
  getStripeClient: () => Stripe
  db: typeof db
}

export interface IJWTPayload {
  userId: string
  deviceId: string
}

export interface IContextAuthenticated extends IContext {
  jwtPayload: IJWTPayload
  device: Device
  masterDeviceId: string | null | undefined
}

export interface IContextMaybeAuthenticated extends IContext {
  jwtPayload?: IJWTPayload
}

export interface Payload {
  userId: string
  iat: number
  exp: number
}
