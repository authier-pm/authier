import { sql } from 'drizzle-orm'
import { bigint, pgSchema, serial, text } from 'drizzle-orm/pg-core'
import type { MigrationMeta } from 'drizzle-orm/migrator'
import type { DbType } from '../prisma/prismaClient'

const migrationJournal = pgSchema('drizzle').table('__drizzle_migrations', {
  id: serial('id').primaryKey(),
  hash: text('hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' })
})

// Production's Prisma introspection baseline was marked applied before its SQL
// was commented out in Git. Preserve that existing journal entry on cutover.
const legacyBaseline = {
  timestamp: 1771813218000,
  appliedHash:
    '894b9ac4b850e6c3ca3caf7ca072c0ba569b30a5b371e339749431e234d341a8',
  committedHash:
    '84cd9b8f524b8fc14ac899d239cffb45dbd990046387d98aa21fa122e4f4d201'
}

export const validMigrations = (value: unknown): value is MigrationMeta[] => {
  if (!Array.isArray(value) || value.length > 256) return false
  let statements = 0
  let previousTimestamp = -1
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return false
    const migration = entry as Partial<MigrationMeta>
    if (
      typeof migration.hash !== 'string' ||
      !/^[a-f0-9]{64}$/.test(migration.hash) ||
      typeof migration.folderMillis !== 'number' ||
      !Number.isSafeInteger(migration.folderMillis) ||
      migration.folderMillis <= previousTimestamp ||
      typeof migration.bps !== 'boolean' ||
      !Array.isArray(migration.sql) ||
      !migration.sql.every((statement) => typeof statement === 'string')
    )
      return false
    previousTimestamp = migration.folderMillis
    statements += migration.sql.length
    return statements <= 2048
  })
}

/** Preserve Drizzle's journal, serialize deploys, and apply pending SQL atomically. */
export const applyDatabaseMigrations = async (
  db: DbType,
  migrations: MigrationMeta[]
) => {
  if (!validMigrations(migrations)) throw new Error('Invalid migration journal')
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(841824223)`)
    await tx.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`)
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id serial PRIMARY KEY, hash text NOT NULL, created_at bigint
    )`)
    const applied = await tx.select().from(migrationJournal)
    const appliedByTimestamp = new Map(
      applied.map((entry) => [entry.createdAt, entry.hash])
    )
    let count = 0
    for (const migration of migrations) {
      const previousHash = appliedByTimestamp.get(migration.folderMillis)
      const isLegacyBaseline =
        migration.folderMillis === legacyBaseline.timestamp &&
        previousHash === legacyBaseline.appliedHash &&
        migration.hash === legacyBaseline.committedHash
      if (
        previousHash &&
        previousHash !== migration.hash &&
        !isLegacyBaseline
      ) {
        throw new Error('An applied migration has been modified')
      }
      if (previousHash) continue
      for (const statement of migration.sql) {
        await tx.execute(sql.raw(statement))
      }
      await tx.insert(migrationJournal).values({
        hash: migration.hash,
        createdAt: migration.folderMillis
      })
      count++
    }
    return count
  })
}
