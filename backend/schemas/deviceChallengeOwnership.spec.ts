import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeForApproval
} from '../models/DecryptionChallenge'
import { RootResolver } from './RootResolver'

vi.mock('../lib/getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))

// testEnv creates an in-memory PGlite database beforeAll and closes it afterAll.
const policies = [
  'REQUIRE_MASTER_DEVICE_APPROVAL',
  'REQUIRE_ANY_DEVICE_APPROVAL'
] as const

describe.each(policies)('device challenge ownership with %s', (policy) => {
  const resolver = new RootResolver()
  const victimId = crypto.randomUUID()
  const attackerId = crypto.randomUUID()
  const email = `${victimId}@test.com`
  const masterDeviceId = crypto.randomUUID()
  const foreignDevice = {
    id: crypto.randomUUID(),
    name: 'Foreign device',
    platform: 'test'
  }
  const ctx = { ...makeFakeCtx({ userId: attackerId }), jwtPayload: undefined }

  beforeAll(async () => {
    await db.insert(schema.user).values(
      [victimId, attackerId].map((id) => ({
        id,
        email: `${id}@test.com`,
        addDeviceSecret: 'unused-test-verifier',
        addDeviceSecretEncrypted: 'private-enrollment-ciphertext',
        encryptionSalt: 'private-test-salt',
        loginCredentialsLimit: 50,
        TOTPlimit: 10,
        deviceRecoveryCooldownMinutes: 960,
        newDevicePolicy: policy
      }))
    )
    await db.insert(schema.device).values(
      [
        { id: masterDeviceId, userId: victimId },
        { id: foreignDevice.id, userId: attackerId }
      ].map((device) => ({
        ...device,
        name: 'Test device',
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        ...defaultDeviceSettingSystemValues
      }))
    )
    await db
      .update(schema.user)
      .set({ masterDeviceId })
      .where(eq(schema.user.id, victimId))
  })

  it('rejects a foreign device without creating an approved challenge', async () => {
    await expect(
      resolver.deviceDecryptionChallenge(email, foreignDevice, ctx)
    ).rejects.toThrow('Login failed')
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { userId: victimId, deviceId: foreignDevice.id }
      })
    ).toBeUndefined()
  })

  it('rejects an already-approved challenge associated with a foreign device', async () => {
    // Model a row created by the vulnerable implementation before this fix.
    const [challenge] = await db
      .insert(schema.decryptionChallenge)
      .values({
        userId: victimId,
        deviceId: foreignDevice.id,
        deviceName: foreignDevice.name,
        ipAddress: '127.0.0.1',
        approvedAt: new Date()
      })
      .returning()

    await expect(
      resolver.deviceDecryptionChallenge(email, foreignDevice, ctx)
    ).rejects.toThrow('Login failed')
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: challenge.id }
      })
    ).toEqual(challenge)
  })

  it('preserves the original master device login before its first challenge', async () => {
    const result = await resolver.deviceDecryptionChallenge(
      email,
      { id: masterDeviceId, name: 'Original master', platform: 'test' },
      ctx
    )
    expect(result).toBeInstanceOf(DecryptionChallengeApproved)
    expect(result).toMatchObject({
      userId: victimId,
      deviceId: masterDeviceId,
      addDeviceSecretEncrypted: 'private-enrollment-ciphertext',
      encryptionSalt: 'private-test-salt'
    })
  })

  it('withholds salt and ciphertext from a new device until approval', async () => {
    const result = await resolver.deviceDecryptionChallenge(
      email,
      { id: crypto.randomUUID(), name: 'New device', platform: 'test' },
      ctx
    )
    expect(result).toBeInstanceOf(DecryptionChallengeForApproval)
    expect(result).not.toHaveProperty('encryptionSalt')
    expect(result).not.toHaveProperty('addDeviceSecretEncrypted')
  })
})
