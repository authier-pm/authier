import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import type { MigrationMeta } from 'drizzle-orm/migrator'
import { db } from '../prisma/prismaClient'
import { applyDatabaseMigrations, validMigrations } from './databaseMigrations'

const migration = (folderMillis: number, statement: string): MigrationMeta => ({
  folderMillis,
  sql: [statement],
  hash: createHash('sha256').update(statement).digest('hex'),
  bps: true
})

// tests/testEnv.ts provisions and closes an isolated PGlite for this suite.
beforeAll(async () => {
  await db.execute(sql`CREATE TABLE migration_test (value integer NOT NULL)`)
  await db.execute(sql`INSERT INTO migration_test VALUES (1)`)
})

describe('private database migrations', () => {
  it('validates ordering and bounds before executing SQL', () => {
    const entry = migration(1, 'SELECT 1')
    expect(validMigrations([entry])).toBe(true)
    expect(validMigrations([entry, entry])).toBe(false)
    expect(validMigrations([{ ...entry, hash: 'invalid' }])).toBe(false)
    expect(validMigrations([{ ...entry, folderMillis: NaN }])).toBe(false)
    expect(
      validMigrations([{ ...entry, sql: Array(2049).fill('SELECT 1') }])
    ).toBe(false)
    expect(validMigrations(null)).toBe(false)
  })

  it('applies pending migrations exactly once and checks previous hashes', async () => {
    const entry = migration(1, 'INSERT INTO migration_test VALUES (2)')
    expect(await applyDatabaseMigrations(db, [entry])).toBe(1)
    expect(await applyDatabaseMigrations(db, [entry])).toBe(0)
    const rows = await db.execute(
      sql`SELECT value FROM migration_test ORDER BY value`
    )
    expect(rows).toMatchObject({ rows: [{ value: 1 }, { value: 2 }] })
    await expect(
      applyDatabaseMigrations(db, [migration(1, 'SELECT 2')])
    ).rejects.toThrow('An applied migration has been modified')
  })

  it('rolls back data and journal entries together on failure', async () => {
    await expect(
      applyDatabaseMigrations(db, [
        migration(2, 'INSERT INTO migration_test VALUES (3)'),
        migration(
          3,
          'INSERT INTO migration_table_that_does_not_exist VALUES (1)'
        )
      ])
    ).rejects.toThrow()
    const rows = await db.execute(
      sql`SELECT value FROM migration_test ORDER BY value`
    )
    expect(rows).toMatchObject({ rows: [{ value: 1 }, { value: 2 }] })
    expect(
      await applyDatabaseMigrations(db, [
        migration(2, 'INSERT INTO migration_test VALUES (4)')
      ])
    ).toBe(1)
  })

  it('preserves only the known production Prisma baseline hash', async () => {
    await db.execute(sql`INSERT INTO drizzle.__drizzle_migrations(hash, created_at)
      VALUES ('894b9ac4b850e6c3ca3caf7ca072c0ba569b30a5b371e339749431e234d341a8', 1771813218000)`)
    const baseline = {
      ...migration(1771813218000, 'SELECT * FROM must_not_replay_baseline'),
      hash: '84cd9b8f524b8fc14ac899d239cffb45dbd990046387d98aa21fa122e4f4d201'
    }
    expect(await applyDatabaseMigrations(db, [baseline])).toBe(0)
    await expect(
      applyDatabaseMigrations(db, [
        {
          ...baseline,
          hash: 'a'.repeat(64)
        }
      ])
    ).rejects.toThrow('An applied migration has been modified')
  })
})
