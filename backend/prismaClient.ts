import { Prisma, PrismaClient } from '@prisma/client'
import './dotenv'

const nodeEnv = process.env.NODE_ENV || 'test'

const logConfig =
  nodeEnv === 'production'
    ? (['info', 'warn'] as Array<Prisma.LogLevel>)
    : [
        {
          emit: 'event',
          level: 'query'
        } as Prisma.LogDefinition,
        'info' as Prisma.LogLevel,
        'warn' as Prisma.LogLevel
      ]

export const prismaClient = new PrismaClient({
  log: logConfig
})
