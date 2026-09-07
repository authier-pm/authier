import { UserMutation } from './UserMutation'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { plainToInstance } from 'class-transformer'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../prisma/prismaClient'
import { user, device, encryptedSecret } from '../drizzle/schema'
import { getEncryptedSecretsToSync } from './Device'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'
import type { Device } from './types/ContextTypes'
import { eq } from 'drizzle-orm'

// The shared testEnv calls setupTestDb in beforeAll and closes its in-memory PGlite in afterAll.
describe('passkey encrypted sync', () => {
  const userId = crypto.randomUUID()
  const passkeyId = crypto.randomUUID()
  const totpId = crypto.randomUUID()
  let browserDevice: Device

  beforeAll(async () => {
    await db.insert(user).values({
      id: userId,
      email: `${userId}@test.com`,
      addDeviceSecret: 'test-enrollment',
      addDeviceSecretEncrypted: 'encrypted-enrollment',
      encryptionSalt: 'salt',
      loginCredentialsLimit: 1,
      TOTPlimit: 10,
      deviceRecoveryCooldownMinutes: 960
    })
    const [createdDevice] = await db
      .insert(device)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: 'new browser',
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        ...defaultDeviceSettingSystemValues,
        syncTOTP: false
      })
      .returning()
    browserDevice = createdDevice
    await db.insert(encryptedSecret).values([
      {
        id: passkeyId,
        userId,
        kind: 'PASSKEY',
        encrypted: 'opaque-passkey-ciphertext',
        version: 1
      },
      {
        id: totpId,
        userId,
        kind: 'TOTP',
        encrypted: 'opaque-totp-ciphertext',
        version: 1
      }
    ])
  })

  const sync = (lastSyncAt: Date | null = null) =>
    getEncryptedSecretsToSync(
      {
        db,
        device: browserDevice,
        jwtPayload: { userId, deviceId: browserDevice.id, tokenVersion: 0 }
      },
      { userId, lastSyncAt }
    )

  it('syncs passkeys to a newly connected browser when TOTP sync is disabled', async () => {
    const records = await sync()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: passkeyId,
      kind: 'PASSKEY',
      encrypted: 'opaque-passkey-ciphertext'
    })
  })

  it('counts stored passkeys against the credential quota for both new passwords and passkeys', async () => {
    const actor = plainToInstance(UserMutation, { id: userId })
    for (const kind of [
      EncryptedSecretTypeGQL.PASSKEY,
      EncryptedSecretTypeGQL.LOGIN_CREDENTIALS
    ]) {
      const result = await actor.addEncryptedSecrets(
        [{ kind, encrypted: 'another-ciphertext' }],
        makeFakeCtx({ userId, device: browserDevice })
      )
      expect(result).toBeInstanceOf(Error)
    }
  })

  it('syncs passkey deletion tombstones to the other browsers', async () => {
    const lastSyncAt = new Date()
    await db
      .update(encryptedSecret)
      .set({ deletedAt: new Date(lastSyncAt.getTime() + 1) })
      .where(eq(encryptedSecret.id, passkeyId))
    const records = await sync(lastSyncAt)
    expect(records).toHaveLength(1)
    expect(records[0].deletedAt).not.toBeNull()
  })
})
