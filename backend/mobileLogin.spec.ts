import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createHash, pbkdf2Sync } from 'node:crypto'
import type { PGlite } from '@electric-sql/pglite'
import { buildApp } from './app'
import { db, setDb } from './prisma/prismaClient'
import { setupTestDb, testDb } from './tests/testEnv'
import * as schema from './drizzle/schema'
import { defaultDeviceSettingSystemValues } from './models/defaultDeviceSettingSystemValues'
import { sign } from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import {
  authenticatedSessionSchema,
  requestDeviceChallengeResultSchema
} from '@shared/orpc/schemas'

vi.mock('./lib/getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))

const app = buildApp()
const enrollmentSecret = 'synthetic-random-enrollment-secret'
const salt = '00112233445566778899aabbccddeeff'
const legacyVerifiers = [
  createHash('sha256').update(enrollmentSecret).digest('hex'),
  `pbkdf2-sha256:600000:${salt}:${pbkdf2Sync(enrollmentSecret, Buffer.from(salt, 'hex'), 600000, 32, 'sha256').toString('hex')}`
]
const accounts = legacyVerifiers.map((verifier) => ({
  userId: crypto.randomUUID(),
  masterId: crypto.randomUUID(),
  verifier
}))
let client: PGlite

beforeAll(async () => {
  client = await setupTestDb()
  setDb(testDb)
  for (const account of accounts) {
    await db.insert(schema.user).values({
      id: account.userId,
      email: `${account.userId}@test.com`,
      addDeviceSecret: account.verifier,
      addDeviceSecretEncrypted: 'encrypted-enrollment-secret',
      encryptionSalt: 'account-salt',
      loginCredentialsLimit: 100,
      TOTPlimit: 100,
      deviceRecoveryCooldownMinutes: 960,
      newDevicePolicy: 'REQUIRE_MASTER_DEVICE_APPROVAL'
    })
    await db.insert(schema.device).values({
      id: account.masterId,
      userId: account.userId,
      name: 'Laptop',
      platform: 'web',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      ...defaultDeviceSettingSystemValues
    })
    await db
      .update(schema.user)
      .set({ masterDeviceId: account.masterId })
      .where(eq(schema.user.id, account.userId))
  }
  // workerd dev and Node don't enforce the hosted Workers PBKDF2 ceiling.
  const deriveBits = crypto.subtle.deriveBits.bind(crypto.subtle)
  vi.spyOn(crypto.subtle, 'deriveBits').mockImplementation(
    (algorithm, key, length) => {
      if (
        typeof algorithm === 'object' &&
        'iterations' in algorithm &&
        typeof algorithm.iterations === 'number' &&
        algorithm.iterations > 100000
      ) {
        return Promise.reject(
          new DOMException(
            'Pbkdf2 failed: iteration counts above 100000 are not supported',
            'NotSupportedError'
          )
        )
      }
      return deriveBits(algorithm, key, length)
    }
  )
})

afterAll(async () => {
  vi.restoreAllMocks()
  await client.close()
})

const request = (route: string, input: unknown, token?: string) =>
  app.handle(
    new Request(`http://authier.test/api/v1/${route}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '127.0.0.1',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(input)
    })
  )

it.each(accounts)(
  'completes approved Android login under Workers crypto limits for $verifier',
  async ({ userId, masterId }) => {
    const deviceInput = {
      id: crypto.randomUUID(),
      name: 'Android phone',
      platform: 'android'
    }
    const challengeInput = { email: `${userId}@test.com`, deviceInput }
    const pendingResponse = await request(
      'auth/requestDeviceChallenge',
      challengeInput
    )
    expect(pendingResponse.status).toBe(200)
    const pending = requestDeviceChallengeResultSchema.parse(
      await pendingResponse.json()
    )
    expect(pending.status).toBe('pending')
    const masterToken = sign(
      { userId, deviceId: masterId, tokenVersion: 0 },
      process.env.ACCESS_TOKEN_SECRET!
    )
    expect(
      (
        await request(
          'devices/approveChallenge',
          { id: pending.challengeId },
          masterToken
        )
      ).status
    ).toBe(200)
    const approvedResponse = await request(
      'auth/requestDeviceChallenge',
      challengeInput
    )
    const approved = requestDeviceChallengeResultSchema.parse(
      await approvedResponse.json()
    )
    expect(approved.status).toBe('approved')
    const loginInput = {
      challengeId: approved.challengeId,
      currentAddDeviceSecret: enrollmentSecret,
      input: {
        firebaseToken: null,
        devicePlatform: 'android',
        encryptionSalt: 'account-salt',
        addDeviceSecret: 'new-synthetic-enrollment-secret',
        addDeviceSecretEncrypted: 'new-encrypted-enrollment-secret'
      }
    }
    const response = await request('auth/completeDeviceLogin', loginInput)
    expect(response.status, await response.clone().text()).toBe(200)
    const session = authenticatedSessionSchema.parse(await response.json())
    expect(session.session.currentDevice.id).toBe(deviceInput.id)
    expect(
      (await request('session/bootstrap', {}, session.accessToken)).status
    ).toBe(200)
    const stored = await db.query.user.findFirst({ where: { id: userId } })
    const parts = stored!.addDeviceSecret.split(':')
    expect(parts.slice(0, 2)).toEqual(['pbkdf2-sha256', '600000'])
    expect(parts[3]).toBe(
      pbkdf2Sync(
        'new-synthetic-enrollment-secret',
        Buffer.from(parts[2]!, 'hex'),
        600000,
        32,
        'sha256'
      ).toString('hex')
    )
    const wrongSecret = await request('auth/completeDeviceLogin', {
      ...loginInput,
      currentAddDeviceSecret: 'wrong-secret'
    })
    expect(wrongSecret.status).toBe(400)
    const retry = await request('auth/completeDeviceLogin', {
      ...loginInput,
      currentAddDeviceSecret: 'new-synthetic-enrollment-secret'
    })
    expect(retry.status, await retry.clone().text()).toBe(200)
  },
  15000
)
