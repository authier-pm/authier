import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import type { PGlite } from '@electric-sql/pglite'
import { setupTestDb } from '../tests/testEnv'

let client: PGlite
const userIds = Array.from({ length: 4 }, () => crypto.randomUUID())
const masterId = crypto.randomUUID()
const foreignId = crypto.randomUUID()

beforeAll(async () => {
  client = await setupTestDb()
  // Restore the old schema so this test exercises the real upgrade SQL.
  await client.exec(`
    ALTER TABLE "DecryptionChallenge"
      DROP COLUMN "emailApprovalTokenHash",
      DROP COLUMN "emailApprovalExpiresAt",
      DROP COLUMN "emailApprovalSentAt",
      DROP COLUMN "emailApprovedAt",
      DROP COLUMN "deviceApprovedAt";
    ALTER TABLE "User" ALTER COLUMN "newDevicePolicy" TYPE text;
    DROP TYPE "UserNewDevicePolicy";
    CREATE TYPE "UserNewDevicePolicy" AS ENUM ('ALLOW', 'REQUIRE_ANY_DEVICE_APPROVAL', 'REQUIRE_MASTER_DEVICE_APPROVAL');
    ALTER TABLE "User" ALTER COLUMN "newDevicePolicy" TYPE "UserNewDevicePolicy" USING "newDevicePolicy"::"UserNewDevicePolicy";
  `)
  for (const [index, policy] of [
    null,
    'ALLOW',
    'REQUIRE_ANY_DEVICE_APPROVAL',
    'REQUIRE_MASTER_DEVICE_APPROVAL'
  ].entries()) {
    await client.query(
      `INSERT INTO "User" (id, "loginCredentialsLimit", "TOTPlimit", "deviceRecoveryCooldownMinutes", "addDeviceSecretHash", "addDeviceSecretEncrypted", "encryptionSalt", "newDevicePolicy") VALUES ($1, 100, 100, 960, 'hash', 'encrypted', 'salt', $2)`,
      [userIds[index], policy]
    )
  }
  for (const [id, userId] of [
    [masterId, userIds[0]],
    [foreignId, userIds[1]]
  ]) {
    await client.query(
      `INSERT INTO "Device" (id, "userId", name, platform, "firstIpAddress", "lastIpAddress", "vaultLockTimeoutSeconds", "syncTOTP", "autofillTOTPEnabled") VALUES ($1, $2, 'Fixture', 'test', '127.0.0.1', '127.0.0.1', 3600, false, true)`,
      [id, userId]
    )
  }
  for (const [name, deviceId, approvingDevice, recovery] of [
    ['automatic', 'not-enrolled', null, false],
    ['foreign', foreignId, null, false],
    ['enrolled', masterId, null, false],
    ['explicit', 'explicitly-approved', masterId, false],
    ['recovery', 'recovery-device', null, true]
  ] as const) {
    await client.query(
      `INSERT INTO "DecryptionChallenge" ("userId", "deviceId", "deviceName", "ipAddress", "approvedAt", "approvedFromDeviceId", "approvedByRecovery") VALUES ($1, $2, $3, '127.0.0.1', '2026-01-01', $4, $5)`,
      [userIds[0], deviceId, name, approvingDevice, recovery]
    )
  }
  const migration = await readFile(
    new URL(
      './migrations/20261111161247_condemned_zombie/migration.sql',
      import.meta.url
    ),
    'utf8'
  )
  await client.exec(`BEGIN;\n${migration}\nCOMMIT;`)
  const masterPolicyMigration = await readFile(
    new URL(
      './migrations/20261111165107_daily_excalibur/migration.sql',
      import.meta.url
    ),
    'utf8'
  )
  await client.exec(masterPolicyMigration)
})

afterAll(async () => {
  await client?.close()
})

describe('device approval migration', () => {
  it('requires a fresh choice for disabled approval and preserves any-device and master-only approval', async () => {
    for (const [index, expected] of [
      null,
      null,
      'OTHER_DEVICE',
      'MASTER_DEVICE'
    ].entries()) {
      const result = await client.query<{ newDevicePolicy: string | null }>(
        'SELECT "newDevicePolicy" FROM "User" WHERE id = $1',
        [userIds[index]]
      )
      expect(result.rows[0].newDevicePolicy).toBe(expected)
    }
    const values = await client.query<{ value: string }>(
      `SELECT unnest(enum_range(NULL::"UserNewDevicePolicy"))::text AS value`
    )
    expect(values.rows.map((row) => row.value)).toEqual([
      'EMAIL',
      'OTHER_DEVICE',
      'EMAIL_OR_OTHER_DEVICE',
      'EMAIL_AND_OTHER_DEVICE',
      'MASTER_DEVICE'
    ])
  })

  it('revokes unearned approvals while retaining enrolled, explicitly approved and recovered devices', async () => {
    const result = await client.query<{
      deviceName: string
      approved: boolean
      deviceApproved: boolean
    }>(
      `SELECT "deviceName", "approvedAt" IS NOT NULL AS approved, "deviceApprovedAt" IS NOT NULL AS "deviceApproved" FROM "DecryptionChallenge" ORDER BY "deviceName"`
    )
    expect(result.rows).toEqual([
      { deviceName: 'automatic', approved: false, deviceApproved: false },
      { deviceName: 'enrolled', approved: true, deviceApproved: false },
      { deviceName: 'explicit', approved: true, deviceApproved: true },
      { deviceName: 'foreign', approved: false, deviceApproved: false },
      { deviceName: 'recovery', approved: true, deviceApproved: false }
    ])
  })
})
