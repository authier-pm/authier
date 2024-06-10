import 'dotenv/config'

import debug from 'debug'
import { enablePrismaDebug } from './prismaDebug'
import { getDbCount } from '../scripts/getDbCount'

import { Prisma, PrismaClient } from '.prisma/client'

const log = debug('prisma:sql')
const logQueries = debug('au:prisma')

const nodeEnv = process.env.NODE_ENV || 'test'

let dbUrl = process.env.DATABASE_URL
console.log('~ dbUrl', dbUrl)

const workerId = process.env.VITEST_WORKER_ID
if (workerId) {
  dbUrl = dbUrl?.includes('?') ? dbUrl?.split('?')[0] : dbUrl
  const vitestWorkerId = Number(process.env.VITEST_WORKER_ID) % getDbCount()
  dbUrl = `${dbUrl}_test_${vitestWorkerId + 1
    }?connection_limit=500&pool_timeout=0&connect_timeout=0` // this allows us to run tests in parallel against multiple dbs without conflicts
} else {
  log('DATABASE_URL', dbUrl)
}

export const prismaClient = new PrismaClient({
  log:
    nodeEnv === 'production'
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
})

const debugLogs = process.env.LOG_PRISMA_SQL

if (debugLogs) {
  enablePrismaDebug(prismaClient)
}

export default prismaClient
//TODO: We should type this
// @ts-expect-error
export const dmmf = prismaClient._runtimeDataModel as any

// helper, because the default prisma interactive transaction timeouts are too low
export const prismaTransaction = <R>(
  fn: (prisma: Prisma.TransactionClient) => Promise<R>
) => {
  return prismaClient.$transaction(fn, {
    timeout: 55000,
    maxWait: 55000
  })
}
