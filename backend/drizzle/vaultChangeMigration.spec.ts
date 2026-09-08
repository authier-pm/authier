import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import type { PGlite } from '@electric-sql/pglite'
import { setupTestDb, testDb } from '../tests/testEnv'
import { db, setDb } from '../prisma/prismaClient'
import { runVaultTransaction } from '../vault/vaultWrites'

let client: PGlite
const accountId = crypto.randomUUID()
const liveId = crypto.randomUUID()
const deletedId = crypto.randomUUID()

beforeAll(async () => {
  client = await setupTestDb()
  setDb(testDb)
  // Model a pre-migration database, including already-deleted vault records.
  await client.exec(`
    DROP TABLE "VaultChange";
    DROP TABLE "VaultOperation";
    ALTER TABLE "User" DROP COLUMN "vaultRevision";
  `)
  await client.query(
    `INSERT INTO "User" (id, "loginCredentialsLimit", "TOTPlimit", "deviceRecoveryCooldownMinutes", "addDeviceSecretHash", "addDeviceSecretEncrypted", "encryptionSalt") VALUES ($1, 100, 100, 960, 'hash', 'encrypted', 'salt')`,
    [accountId]
  )
  await client.query(
    `INSERT INTO "EncryptedSecret" (id, "userId", encrypted, kind, version, "createdAt", "deletedAt") VALUES ($1, $3, 'live', 'PASSKEY', 5, '2025-01-01', NULL), ($2, $3, 'deleted', 'TOTP', 2, '2025-01-02', '2025-01-03')`,
    [liveId, deletedId, accountId]
  )
})
afterAll(async () => {
  await client.close()
})

describe('vault change migration', () => {
  it('follows the passkey migration without dropping the passkey enum value', async () => {
    const snapshots = await Promise.all(
      [
        './migrations/20260907222057_fat_dark_beast/snapshot.json',
        './migrations/20260908002509_warm_radioactive_man/snapshot.json'
      ].map(async (path) =>
        JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
      )
    )
    const [passkeySnapshot, vaultSnapshot] = snapshots
    expect(vaultSnapshot.prevIds).toEqual([passkeySnapshot.id])
    expect(vaultSnapshot.ddl).toContainEqual(
      expect.objectContaining({
        entityType: 'enums',
        name: 'EncryptedSecretType',
        values: ['TOTP', 'LOGIN_CREDENTIALS', 'PASSKEY']
      })
    )
  })

  it('backfills live records and tombstones, then continues revisions through the API', async () => {
    const migration = await readFile(
      new URL(
        './migrations/20260908002509_warm_radioactive_man/migration.sql',
        import.meta.url
      ),
      'utf8'
    )
    await client.exec(`BEGIN;\n${migration}\nCOMMIT;`)
    const triggers = await client.query(
      `SELECT tgname FROM pg_trigger WHERE tgrelid = '"EncryptedSecret"'::regclass AND NOT tgisinternal`
    )
    expect(triggers.rows).toEqual([])
    const backfill = await client.query(
      'SELECT "secretId", revision, version, kind, "deletedAt" FROM "VaultChange" ORDER BY revision'
    )
    expect(backfill.rows).toMatchObject([
      {
        secretId: liveId,
        revision: 1,
        version: 5,
        kind: 'PASSKEY',
        deletedAt: null
      },
      { secretId: deletedId, revision: 2, version: 2 }
    ])
    await runVaultTransaction(db, accountId, (writer) =>
      writer.update([liveId], { encrypted: 'changed' })
    )
    const next = await client.query(
      'SELECT revision, version FROM "VaultChange" WHERE revision = 3'
    )
    expect(next.rows).toEqual([{ revision: 3, version: 6 }])
    const counter = await client.query(
      'SELECT "vaultRevision" FROM "User" WHERE id = $1',
      [accountId]
    )
    expect(counter.rows).toEqual([{ vaultRevision: 3 }])
  })

  it('rolls back revision allocation with the transaction and cascades account deletion', async () => {
    await expect(
      runVaultTransaction(db, accountId, async (writer) => {
        await writer.update([liveId], { encrypted: 'rolled-back' })
        throw new Error('abort transaction')
      })
    ).rejects.toThrow('abort transaction')
    const counter = await client.query(
      'SELECT "vaultRevision" FROM "User" WHERE id = $1',
      [accountId]
    )
    expect(counter.rows).toEqual([{ vaultRevision: 3 }])
    await client.query('DELETE FROM "User" WHERE id = $1', [accountId])
    expect((await client.query('SELECT * FROM "VaultChange"')).rows).toEqual([])
  })
})
