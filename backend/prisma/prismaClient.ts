import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'

const connectionString = process.env.DATABASE_URL ?? ''

const globalClient = postgres(connectionString)
const defaultDb = drizzle({ client: globalClient, schema: dbSchema, relations })

export type DbType = typeof defaultDb

let _db: DbType = defaultDb

// Proxy ensures that any reference to `db` always delegates to the current
// `_db` target — allowing tests to swap in a PGlite instance via setDb().
export const db: DbType = new Proxy({} as DbType, {
  get(_, prop) {
    const value = (_db as any)[prop]
    if (typeof value === 'function') {
      return value.bind(_db)
    }
    return value
  }
})

export const setDb = (newDb: any) => {
  _db = newDb
}

export const createRequestDb = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      db: _db,
      close: async () => {}
    }
  }

  const client = postgres(connectionString, { max: 1 })
  const requestDb = drizzle({ client, schema: dbSchema, relations })
  return {
    db: requestDb,
    close: async () => client.end()
  }
}
