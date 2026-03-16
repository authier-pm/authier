import 'reflect-metadata'
import { faker } from '@faker-js/faker'
import 'dotenv/config'
import { beforeAll } from 'vitest'
import debug from 'debug'

faker.seed(1)
export const log = debug('au:test')

import { PGlite } from '@electric-sql/pglite'
// @ts-expect-error
import { citext } from '@electric-sql/pglite/contrib/citext'
import { drizzle } from 'drizzle-orm/pglite'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { runMigrationsForPGlite } from './runMigrationsForPGlite'
import { join } from 'path'
import { setDb } from '../prisma/prismaClient'

export let testDb: ReturnType<typeof drizzle>

export async function setupTestDb(): Promise<PGlite> {
  const client = new PGlite({
    extensions: { citext }
  })
  const db = drizzle({ client, schema: dbSchema, relations, logger: false })

  db.transaction = async (cb: any) => {
    return cb(db)
  }

  testDb = db
  // @ts-expect-error
  testDb.__instance = db

  const migrationsFolder = join(__dirname, '../drizzle/migrations')
  await runMigrationsForPGlite(client, migrationsFolder)

  return client
}

beforeAll(async () => {
  log('test environment initialized')
  await setupTestDb()
  setDb(testDb)
})
