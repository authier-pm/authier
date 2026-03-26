import { log } from './testEnv'
import { sql } from 'drizzle-orm'

/**
 * if you need to truncate inside your tests, just call this function. In regular tests, we only invoke this after all specs in current test file are done
 */
export const truncateAllTables = async () => {
  const { db } = await import('../prisma/prismaClient')
  const tableNamesResult: unknown = await db.execute(
    sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`
  )
  const tableNameRows = Array.isArray(tableNamesResult)
    ? tableNamesResult
    : typeof tableNamesResult === 'object' &&
        tableNamesResult !== null &&
        'rows' in tableNamesResult &&
        Array.isArray((tableNamesResult as { rows: unknown[] }).rows)
      ? (tableNamesResult as { rows: unknown[] }).rows
      : []

  const tables = tableNameRows
    .map((row) =>
      typeof row === 'object' && row !== null && 'tablename' in row
        ? String(row.tablename)
        : null
    )
    .filter((tableName): tableName is string => tableName !== null)
    .filter((tableName: string) => {
      return tableName !== '_prisma_migrations'
    })

  for (const tablename of tables) {
    try {
      await db.execute(
        sql.raw(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
      )
    } catch (error) {
      console.error({ error })
    }
  }
  log('truncated all tables')
}
