import 'dotenv/config'

import debug from 'debug'
import { enablePrismaDebug } from './prismaDebug'
import { getDbCount } from '../scripts/getDbCount'

import { DMMFClass } from '.prisma/client/runtime'
import { PrismaClient } from '.prisma/client'
console.log(__dirname)

const log = debug('prisma:sql')
const logQueries = debug('au:prisma')

const nodeEnv = process.env.NODE_ENV || 'test'

let dbUrl = process.env.DATABASE_URL
console.log('~ dbUrl', dbUrl)

const workerId = process.env.VITEST_WORKER_ID
if (workerId) {
  const vitestWorkerId = Number(process.env.VITEST_WORKER_ID) % getDbCount()
  dbUrl = `${dbUrl}_test_${vitestWorkerId + 1}` // this allows us to run tests in parallel against multiple dbs without conflicts
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
export const dmmf = (prismaClient as any)._baseDmmf as DMMFClass
