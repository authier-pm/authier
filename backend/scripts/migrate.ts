import { config } from 'dotenv'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { applyDatabaseMigrations } from '../lib/databaseMigrations'
import { databaseConnectionString } from '../prisma/prismaClient'
import { migrateRemote } from './migrateRemote'

const main = async () => {
  if (process.env.WORKERS_CI === '1' || process.argv.includes('--remote')) {
    await migrateRemote(process.argv.includes('--check'))
  } else {
    config({ quiet: true })
    const client = postgres(
      databaseConnectionString({
        DATABASE_URL: process.env.DATABASE_URL
      }),
      {
        max: 1,
        connect_timeout: 10
      }
    )
    try {
      const db = drizzle({ client, schema: dbSchema, relations })
      const applied = await applyDatabaseMigrations(
        db,
        readMigrationFiles({
          migrationsFolder: './drizzle/migrations'
        })
      )
      console.log(`Applied ${applied} database migrations`)
    } finally {
      await client.end({ timeout: 1 })
    }
  }
}

void main()
