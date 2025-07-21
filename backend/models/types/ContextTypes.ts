import type { FastifyReply, FastifyRequest } from 'fastify'
import type { prismaClient } from '../../prisma/prismaClient'
import type { Device } from '@prisma/client'

export interface IContext {
  request: FastifyRequest
  reply: FastifyReply
  getIpAddress: () => string
  prisma: typeof prismaClient
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
