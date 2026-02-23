import { log } from './testEnv'
import { sql } from 'drizzle-orm'

/**
 * if you need to truncate inside your tests, just call this function. In regular tests, we only invoke this after all specs in current test file are done
 */
export const truncateAllTables = async () => {
  const { db } = await import('../prisma/prismaClient')
  const tableNames = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`
  )

  const tables = (tableNames as any)
    .map((row: any) => row.tablename)
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
