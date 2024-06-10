import { format } from 'sql-formatter'
import { highlight } from 'sql-highlight'
import debug from 'debug'
import { PrismaClient } from '.prisma/client'

export let queryCount = 0

const log = debug('prisma:sql')
const logQueries = debug('mm:prisma')

export const enablePrismaDebug = (prismaClient: PrismaClient) => {
  //@ts-expect-error Prisma wrong types
  prismaClient.$on('query', (event: any) => {
    queryCount++

    const { params, query } = event
    const paramsAsArray = params.substring(1, params.length - 1).split(',')

    const queryWithVarsReplaced = query.replaceAll(/\$\d/g, (m: string) => {
      const param = paramsAsArray[Number(m.substring(1)) - 1]
      return param
    })

    log(highlight(format(queryWithVarsReplaced)))
  })

  prismaClient.$use(async (params, next) => {
    const before = Date.now()
    // log(params) // use for debugging mysteriously failing prisma queries
    const result = await next(params)

    const after = Date.now()
    if (Array.isArray(result) && params.action !== 'findUnique') {
      logQueries(
        `${params.model}.${params.action} results: ${result.length} ${after - before
        }ms`
      )
    } else {
      logQueries(
        `${params.model}.${params.action} returned ${result?.id ?? result?.[0]?.id ?? null
        } ${after - before}ms`
      )
    }

    return result
  })
}
