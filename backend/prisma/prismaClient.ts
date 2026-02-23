import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'

const connectionString = process.env.DATABASE_URL ?? ''

const globalClient = postgres(connectionString)
export const db = drizzle({ client: globalClient, schema: dbSchema, relations })

export const createRequestDb = () => {
  const client = postgres(connectionString, { max: 1 })
  const requestDb = drizzle({ client, schema: dbSchema, relations })
  return {
    db: requestDb,
    close: async () => client.end()
  }
}
