import 'reflect-metadata'
import { faker } from '@faker-js/faker'
import 'dotenv/config'
import { afterAll, beforeAll, vi } from 'vitest'
import debug from 'debug'

faker.seed(1)
export const log = debug('au:test')

beforeAll(() => {
  const fakeMailjetPost = {
    request: vi.fn()
  }
  log('mocked mailjet post')
  // we don't want to send anything from tests.
  vi.mock('node-mailjet', () => ({
    default: {
      apiConnect: () => {
        return {
          post: () => {
            return fakeMailjetPost
          }
        }
      }
    }
  }))
})

import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { runMigrationsForPGlite } from './runMigrationsForPGlite'
import { join } from 'path'

export let testDb: ReturnType<typeof drizzle>

export async function setupTestDb(): Promise<PGlite> {
  const client = new PGlite()
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
