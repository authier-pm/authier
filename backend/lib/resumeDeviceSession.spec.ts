import { beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import { hashDeviceSecret, verifyDeviceSecret } from '../utils/deviceSecretHash'
import { resumeDeviceSession } from './resumeDeviceSession'

const userId = crypto.randomUUID()
const email = `${userId}@example.com`
const devices = {
  a: crypto.randomUUID(),
  b: crypto.randomUUID(),
  legacy: crypto.randomUUID(),
  revoked: crypto.randomUUID(),
  deleted: crypto.randomUUID(),
  outdated: crypto.randomUUID()
}
const ctx = makeFakeCtx({ userId })
let accountHash: string

beforeAll(async () => {
  accountHash = await hashDeviceSecret('account-secret')
  await db.insert(schema.user).values({
    id: userId,
    email,
    addDeviceSecret: accountHash,
    addDeviceSecretEncrypted: 'account-ciphertext',
    encryptionSalt: 'salt',
    loginCredentialsLimit: 100,
    TOTPlimit: 100,
    deviceRecoveryCooldownMinutes: 960
  })
  for (const [name, id] of Object.entries(devices)) {
    await db.insert(schema.device).values({
      id,
      userId,
      name,
      platform: 'test',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      resumeSecretHash:
        name === 'legacy' ? null : await hashDeviceSecret(`${name}-secret`),
      resumeTokenVersion: name === 'outdated' ? -1 : 0,
      logoutAt: name === 'revoked' ? new Date() : null,
      deletedAt: name === 'deleted' ? new Date() : null,
      ...defaultDeviceSettingSystemValues
    })
  }
})

const resume = (deviceId: string, secret: string, next = secret) =>
  resumeDeviceSession(ctx, {
    email,
    deviceId,
    currentAddDeviceSecret: secret,
    input: {
      addDeviceSecret: next,
      addDeviceSecretEncrypted: `encrypted-${next}`,
      encryptionSalt: 'salt',
      devicePlatform: 'test',
      firebaseToken: null
    }
  })

describe('device-bound session renewal', () => {
  it('survives enrollment on another device and leaves the account secret unchanged', async () => {
    await resume(devices.a, 'a-secret', 'a-next')
    await resume(devices.b, 'b-secret')
    await expect(resume(devices.a, 'a-next')).resolves.toMatchObject({
      device: { id: devices.a }
    })
    expect(
      await db.query.user.findFirst({ where: { id: userId } })
    ).toMatchObject({
      addDeviceSecret: accountHash,
      addDeviceSecretEncrypted: 'account-ciphertext'
    })
  })

  it('does not accept another device or the account credential for an enrolled device', async () => {
    await expect(resume(devices.b, 'a-next')).rejects.toThrow('needs approval')
    await expect(resume(devices.b, 'account-secret')).rejects.toThrow(
      'needs approval'
    )
  })

  it.each(['revoked', 'deleted', 'outdated'] as const)(
    'rejects a %s device',
    async (name) => {
      await expect(resume(devices[name], `${name}-secret`)).rejects.toThrow(
        'needs approval'
      )
    }
  )

  it('initializes a legacy device credential without changing the account credential', async () => {
    const result = await resume(
      devices.legacy,
      'account-secret',
      'legacy-secret'
    )
    expect(
      await verifyDeviceSecret('legacy-secret', result.device.resumeSecretHash!)
    ).toBe(true)
    await expect(resume(devices.legacy, 'account-secret')).rejects.toThrow(
      'needs approval'
    )
  })

  it('can retry a stable credential after a lost response or a lock during renewal', async () => {
    await resume(devices.b, 'b-secret')
    await expect(resume(devices.b, 'b-secret')).resolves.toMatchObject({
      device: { id: devices.b }
    })
  })

  it('invalidates saved credentials when the account token version changes', async () => {
    await db
      .update(schema.user)
      .set({ tokenVersion: 1 })
      .where(eq(schema.user.id, userId))
    await expect(resume(devices.a, 'a-next')).rejects.toThrow('needs approval')
    await expect(resume(devices.legacy, 'legacy-secret')).rejects.toThrow(
      'needs approval'
    )
  })
})
