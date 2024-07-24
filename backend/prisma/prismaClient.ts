import 'dotenv/config'

import debug from 'debug'
import { enablePrismaDebug } from './prismaDebug'
import { getDbCount } from '../scripts/getDbCount'

import { PrismaClient, Prisma } from '@prisma/client'
import kyselyExtension from 'prisma-extension-kysely'
import type { DB } from './generated/types'

import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler
} from 'kysely'

const log = debug('prisma:sql')
const logQueries = debug('au:prisma')

const NODE_ENV = process.env.NODE_ENV || 'test'

let dbUrl = process.env.DATABASE_URL
console.log('~ dbUrl', dbUrl)

const workerId = process.env.VITEST_WORKER_ID
if (workerId) {
  dbUrl = dbUrl?.includes('?') ? dbUrl?.split('?')[0] : dbUrl
  const vitestWorkerId = Number(process.env.VITEST_WORKER_ID) % getDbCount()
  dbUrl = `${dbUrl}_test_${
    vitestWorkerId + 1
  }?connection_limit=500&pool_timeout=0&connect_timeout=0` // this allows us to run tests in parallel against multiple dbs without conflicts
} else {
  log('DATABASE_URL', dbUrl)
}

export const prismaClient = new PrismaClient({
  transactionOptions: {
    timeout: 55_000,
    maxWait: 55_000
  },
  log:
    NODE_ENV === 'production'
      ? ['info', 'warn']
      : [
          {
            emit: 'event',
            level: 'query'
          },
          'info',
          'warn'
        ],
  errorFormat: workerId ? 'pretty' : undefined,
  datasources: {
    db: {
      url: dbUrl
    }
  }
}).$extends(
  kyselyExtension({
    kysely: (driver) =>
      new Kysely<DB>({
        dialect: {
          // This is where the magic happens!
          createDriver: () => driver,
          // Don't forget to customize these to match your database!
          createAdapter: () => new PostgresAdapter(),
          createIntrospector: (db) => new PostgresIntrospector(db),
          createQueryCompiler: () => new PostgresQueryCompiler()
        }
      })
  })
)

const debugLogs = process.env.LOG_PRISMA_SQL

if (debugLogs) {
  enablePrismaDebug(prismaClient)
}

// @ts-expect-error
export const dmmf = prismaClient._runtimeDataModel as any
