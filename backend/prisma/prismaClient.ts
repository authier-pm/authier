import { Prisma, PrismaClient } from '@prisma/client'
import '../dotenv'
import { DMMFClass } from '@prisma/client/runtime'

import debug from 'debug'
import { enablePrismaDebug } from './prismaDebug'

const log = debug('prisma:sql')
const logQueries = debug('fase:prisma')

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

let dbUrl = process.env.DATABASE_URL

if (process.env.JEST_WORKER_ID) {
  dbUrl = `${dbUrl}_test_${Number(process.env.JEST_WORKER_ID) + 1}` // this allows us to run tests in parallel against multiple dbs without conflicts
} else {
  log('DATABASE_URL', dbUrl)
}

export const prismaClient = new PrismaClient({
  log: logConfig,
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: dbUrl
    }
  }
})

const debugLogs = process.env.LOG_PRISMA_SQL

if (debugLogs) {
  enablePrismaDebug(prismaClient)
}

export default prismaClient
export const dmmf = (prismaClient as any)._dmmf as DMMFClass
