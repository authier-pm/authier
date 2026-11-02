import { AsyncLocalStorage } from 'node:async_hooks'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'

export type DbType = PostgresJsDatabase<typeof dbSchema, typeof relations>

export interface DatabaseBindings {
  HYPERDRIVE?: { connectionString: string }
  DATABASE_URL?: string
}

const requestDatabase = new AsyncLocalStorage<DbType>()
let defaultDb: DbType | undefined

export const databaseConnectionString = (bindings: DatabaseBindings) => {
  const connectionString =
    bindings.HYPERDRIVE?.connectionString ?? bindings.DATABASE_URL
  if (!connectionString) throw new Error('Database is not configured')
  return connectionString
}

const openDatabase = (connectionString: string) => {
  const client = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    max_lifetime: 60,
    fetch_types: false
  })
  return {
    db: drizzle({ client, schema: dbSchema, relations }),
    close: () => client.end({ timeout: 1 })
  }
}

const currentDatabase = () => {
  const scoped = requestDatabase.getStore() ?? defaultDb
  if (scoped) return scoped
  defaultDb = openDatabase(
    databaseConnectionString({
      DATABASE_URL: process.env.DATABASE_URL
    })
  ).db
  return defaultDb
}

// Existing model helpers and webhooks must use the invocation's database too.
export const db: DbType = new Proxy({} as DbType, {
  get(_, prop) {
    const current = currentDatabase()
    const value: unknown = Reflect.get(current, prop)
    return typeof value === 'function' ? value.bind(current) : value
  }
})

// PGlite implements the same query surface, with a different driver result type.
export const setDb = (newDb: unknown) => {
  defaultDb = newDb as DbType
}

export const createRequestDb = () => {
  const scoped = requestDatabase.getStore()
  if (scoped || process.env.NODE_ENV === 'test') {
    return { db: scoped ?? currentDatabase(), close: async () => {} }
  }
  return openDatabase(
    databaseConnectionString({
      DATABASE_URL: process.env.DATABASE_URL
    })
  )
}

/** One database connection per Worker invocation, closed before it completes. */
export const withDatabase = async <T>(
  bindings: DatabaseBindings,
  work: () => T | Promise<T>
) => {
  const connection = openDatabase(databaseConnectionString(bindings))
  try {
    return await requestDatabase.run(connection.db, work)
  } finally {
    await connection.close()
  }
}
