import { format } from 'sql-formatter'
import { highlight } from 'sql-highlight'
import debug from 'debug'
import type { Logger } from 'drizzle-orm/logger'

export let queryCount = 0

const log = debug('drizzle:sql')
const logQueries = debug('au:drizzle')

export class DrizzleDebugLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    queryCount++

    let queryWithVarsReplaced = query
    params.forEach((param, index) => {
      const value = typeof param === 'string' ? `'${param}'` : String(param)
      queryWithVarsReplaced = queryWithVarsReplaced.replace(
        `$${index + 1}`,
        value
      )
    })

    log(highlight(format(queryWithVarsReplaced)))
    logQueries(`query #${queryCount}`)
  }
}
