import { Prisma, PrismaClient } from '@prisma/client'
import './dotenv'

import { format } from 'sql-formatter'
import { highlight } from 'sql-highlight'
import debug from 'debug'

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
  datasources: {
    db: {
      url: dbUrl
    }
  }
})

const debugLogs = process.env.LOG_PRISMA_SQL
export let queryCount = 0
// @ts-expect-error Prisma has bad typings
prismaClient.$on('query', (event) => {
  queryCount++
  if (debugLogs) {
    // @ts-expect-error Prisma has bad typings
    const { params, query } = event
    const paramsAsArray = params.substring(1, params.length - 1).split(',')

    const queryWithVarsReplaced = query.replaceAll(/\$\d/g, (m: string) => {
      const param = paramsAsArray[Number(m.substring(1)) - 1]
      return param
    })

    log(highlight(format(queryWithVarsReplaced)))
  }
})

prismaClient.$use(async (params, next) => {
  const before = Date.now()
  // log(params) // use for debugging mysteriously failing prisma queries
  const result = await next(params)

  const after = Date.now()
  if (Array.isArray(result) && params.action !== 'findUnique') {
    logQueries(
      `${params.model}.${params.action} results: ${result.length} ${
        after - before
      }ms`
    )
  } else {
    logQueries(
      `${params.model}.${params.action} returned ${
        result?.id ?? result?.[0]?.id ?? null
      } ${after - before}ms`
    )
  }

  return result
})

export default prismaClient
