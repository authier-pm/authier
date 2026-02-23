import type { FastifyReply, FastifyRequest } from 'fastify'
import type { db } from '../../prisma/prismaClient'
import * as dbSchema from '../../drizzle/schema'
import type { InferSelectModel } from 'drizzle-orm'
export type Device = InferSelectModel<typeof dbSchema.device>

export interface IContext {
  request: FastifyRequest
  reply: FastifyReply
  getIpAddress: () => string
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
