import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { DrizzleDebugLogger } from './prismaDebug'

const dbUrl = process.env.DATABASE_URL

const pool = new Pool({
  connectionString: dbUrl
})

const logger = process.env.LOG_PRISMA_SQL ? new DrizzleDebugLogger() : false

export const db = drizzle({ client: pool, schema: dbSchema, relations, logger })
