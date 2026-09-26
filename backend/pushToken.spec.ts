import { beforeAll, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { sign } from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { buildApp } from './app'
import { db } from './prisma/prismaClient'
import * as schema from './drizzle/schema'
import { defaultDeviceSettingSystemValues } from './models/defaultDeviceSettingSystemValues'

const { sendNotification } = vi.hoisted(() => ({
  sendNotification: vi.fn().mockResolvedValue({ ok: true })
}))
vi.mock('./lib/firebaseAdmin', () => ({
  firebaseSendNotification: sendNotification
}))
vi.mock('./lib/getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))
const app = buildApp()
const userId = crypto.randomUUID()
const phoneId = crypto.randomUUID()
const masterId = crypto.randomUUID()
let accessToken: string

// testEnv creates PGlite with setupTestDb in beforeAll and closes it in afterAll.
beforeAll(async () => {
  await db.insert(schema.user).values({
    id: userId,
    email: `${userId}@test.com`,
    addDeviceSecret: createHash('sha256')
      .update('test-enrollment')
      .digest('hex'),
    addDeviceSecretEncrypted: 'encrypted-enrollment',
    encryptionSalt: 'salt',
    loginCredentialsLimit: 100,
    TOTPlimit: 100,
    deviceRecoveryCooldownMinutes: 960,
    newDevicePolicy: 'REQUIRE_ANY_DEVICE_APPROVAL'
  })
  await db.insert(schema.device).values(
    [phoneId, masterId].map((id) => ({
      id,
      userId,
      name: id === phoneId ? 'Android phone' : 'Browser',
      platform: 'test',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      ...defaultDeviceSettingSystemValues
    }))
  )
  await db
    .update(schema.user)
    .set({ masterDeviceId: masterId })
    .where(eq(schema.user.id, userId))
  accessToken = sign(
    { userId, deviceId: phoneId, tokenVersion: 0 },
    process.env.ACCESS_TOKEN_SECRET!
  )
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

it('registers and rotates the authenticated phone token without changing the master device', async () => {
  for (const token of ['initial-phone-token', 'rotated-phone-token']) {
    expect(
      (await request('session/updatePushToken', { token }, accessToken)).status
    ).toBe(200)
    expect(
      (await db.query.device.findFirst({ where: { id: phoneId } }))
        ?.firebaseToken
    ).toBe(token)
    expect(
      (await db.query.device.findFirst({ where: { id: masterId } }))
        ?.firebaseToken
    ).toBeNull()
  }
  const response = await request('auth/requestDeviceChallenge', {
    email: `${userId}@test.com`,
    deviceInput: {
      id: crypto.randomUUID(),
      name: 'New laptop',
      platform: 'web'
    }
  })
  expect(response.status).toBe(200)
  expect(sendNotification).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      token: 'rotated-phone-token',
      data: { type: 'Devices' }
    })
  )
  expect(await response.json()).toMatchObject({
    pushNotificationsSentCount: 1,
    pushNotificationsFailedCount: 0
  })
})

it('requires authentication and rejects empty tokens', async () => {
  expect(
    (await request('session/updatePushToken', { token: 'unauthorized-token' }))
      .status
  ).toBe(401)
  expect(
    (await request('session/updatePushToken', { token: ' ' }, accessToken))
      .status
  ).toBe(400)
})

it('notifies the phone after a successful new login when approval is not required', async () => {
  sendNotification.mockClear()
  await db
    .update(schema.user)
    .set({ newDevicePolicy: 'ALLOW' })
    .where(eq(schema.user.id, userId))
  const response = await request('auth/requestDeviceChallenge', {
    email: `${userId}@test.com`,
    deviceInput: {
      id: crypto.randomUUID(),
      name: 'New laptop',
      platform: 'web'
    }
  })
  const challenge = await response.json()
  expect(challenge.status).toBe('approved')
  expect(sendNotification).not.toHaveBeenCalled()
  const login = {
    challengeId: challenge.challengeId,
    currentAddDeviceSecret: 'test-enrollment',
    input: {
      firebaseToken: null,
      devicePlatform: 'web',
      encryptionSalt: 'salt',
      addDeviceSecret: 'next-enrollment',
      addDeviceSecretEncrypted: 'encrypted-next-enrollment'
    }
  }
  expect(
    (
      await request('auth/completeDeviceLogin', {
        ...login,
        currentAddDeviceSecret: 'wrong-password'
      })
    ).status
  ).toBe(400)
  expect(sendNotification).not.toHaveBeenCalled()
  expect((await request('auth/completeDeviceLogin', login)).status).toBe(200)
  expect(sendNotification).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      token: 'rotated-phone-token',
      notification: {
        title: 'New device login!',
        body: 'New laptop signed in to your Authier account.'
      }
    })
  )
})

it('allows clearing the current token and refuses revoked devices', async () => {
  expect(
    (await request('session/updatePushToken', { token: null }, accessToken))
      .status
  ).toBe(200)
  expect(
    (await db.query.device.findFirst({ where: { id: phoneId } }))?.firebaseToken
  ).toBeNull()
  await db
    .update(schema.device)
    .set({ logoutAt: new Date() })
    .where(eq(schema.device.id, phoneId))
  expect(
    (
      await request(
        'session/updatePushToken',
        { token: 'revoked-phone-token' },
        accessToken
      )
    ).status
  ).toBe(401)
})
