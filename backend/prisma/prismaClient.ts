import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { DrizzleDebugLogger } from './prismaDebug'

const dbUrl = process.env.DATABASE_URL

const logger = process.env.LOG_PRISMA_SQL ? new DrizzleDebugLogger() : false

const createPostgresClient = () =>
  postgres(dbUrl as string, {
    // Cloudflare Workers can reject cross-request socket reuse; disabling prepare
    // avoids prepared statement state and keeps request-scoped clients simpler.
    prepare: false
  })

const client = createPostgresClient()

export const db = drizzle({ client, schema: dbSchema, relations, logger })

export const createRequestDb = () => {
  const client = createPostgresClient()
  const requestDb = drizzle({ client, schema: dbSchema, relations, logger })

  return {
    db: requestDb,
    close: () => client.end()
  }
}
