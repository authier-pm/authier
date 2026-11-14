import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { sign } from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { buildApp } from '../app'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { sentEmails } from '../utils/email'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import { requestDeviceChallengeResultSchema } from '../../shared/orpc/schemas'

const { sendNotification } = vi.hoisted(() => ({
  sendNotification: vi.fn().mockResolvedValue({ ok: true })
}))
vi.mock('../lib/firebaseAdmin', () => ({
  firebaseSendNotification: sendNotification
}))
vi.mock('../lib/getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))

const app = buildApp()
const fixtureNames = [
  'master',
  'other',
  'missing',
  'loggedOut',
  'deleted',
  'noToken',
  'forged',
  'emailGrant',
  'transfer'
] as const
const fixtures = Object.fromEntries(
  fixtureNames.map((name) => [
    name,
    {
      userId: crypto.randomUUID(),
      masterId: crypto.randomUUID(),
      otherId: crypto.randomUUID(),
      newId: crypto.randomUUID()
    }
  ])
)
type Fixture = (typeof fixtures)[string]

// testEnv opens PGlite with setupTestDb in beforeAll and closes it in afterAll.
beforeAll(async () => {
  for (const [name, fixture] of Object.entries(fixtures)) {
    await db.insert(schema.user).values({
      id: fixture.userId,
      email: `${fixture.userId}@test.com`,
      addDeviceSecret: createHash('sha256')
        .update('test-enrollment')
        .digest('hex'),
      addDeviceSecretEncrypted: 'encrypted-enrollment',
      encryptionSalt: 'secret-salt',
      loginCredentialsLimit: 100,
      TOTPlimit: 100,
      deviceRecoveryCooldownMinutes: 960,
      newDevicePolicy: name === 'other' ? 'OTHER_DEVICE' : 'MASTER_DEVICE'
    })
    await db.insert(schema.device).values(
      [fixture.masterId, fixture.otherId].map((id) => ({
        id,
        userId: fixture.userId,
        name: id === fixture.masterId ? 'Master' : 'Other',
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        firebaseToken:
          name === 'noToken' && id === fixture.masterId
            ? null
            : `push-token-${id}`,
        logoutAt:
          name === 'loggedOut' && id === fixture.masterId ? new Date() : null,
        deletedAt:
          name === 'deleted' && id === fixture.masterId ? new Date() : null,
        ...defaultDeviceSettingSystemValues
      }))
    )
    if (name !== 'missing')
      await db
        .update(schema.user)
        .set({ masterDeviceId: fixture.masterId })
        .where(eq(schema.user.id, fixture.userId))
  }
})
beforeEach(() => sendNotification.mockClear())

const request = (
  route: string,
  input: unknown,
  fixture: Fixture,
  deviceId?: string
) =>
  app.handle(
    new Request(`https://api.authier.pm/api/v1/${route}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '127.0.0.1',
        ...(deviceId
          ? {
              authorization: `Bearer ${sign({ userId: fixture.userId, deviceId, tokenVersion: 0 }, process.env.ACCESS_TOKEN_SECRET!)}`
            }
          : {})
      },
      body: JSON.stringify(input)
    })
  )
const challengeFor = async (fixture: Fixture) => {
  const response = await request(
    'auth/requestDeviceChallenge',
    {
      email: `${fixture.userId}@test.com`,
      deviceInput: { id: fixture.newId, name: 'New laptop', platform: 'test' }
    },
    fixture
  )
  expect(response.status, await response.clone().text()).toBe(200)
  return requestDeviceChallengeResultSchema.parse(await response.json())
}
const pendingFor = async (fixture: Fixture) => {
  const pending = await challengeFor(fixture)
  expect(pending.status).toBe('pending')
  expect(pending).not.toHaveProperty('encryptionSalt')
  expect(pending).not.toHaveProperty('addDeviceSecretEncrypted')
  if (pending.status !== 'pending') throw new Error('Expected pending approval')
  return pending
}
const approve = (fixture: Fixture, id: number, deviceId: string) =>
  request('devices/approveChallenge', { id }, fixture, deviceId)
const enroll = (fixture: Fixture, challengeId: number) =>
  request(
    'auth/completeDeviceLogin',
    {
      challengeId,
      currentAddDeviceSecret: 'test-enrollment',
      input: {
        firebaseToken: null,
        devicePlatform: 'test',
        encryptionSalt: 'new-salt',
        addDeviceSecret: 'next-secret',
        addDeviceSecretEncrypted: 'next-encrypted'
      }
    },
    fixture
  )

// Use the public API so authorization, serialization and enrollment are exercised together.
describe('master-only new device approval', () => {
  it('notifies only the master, rejects other devices, and releases secrets only after master approval', async () => {
    const fixture = fixtures.master
    const pending = await pendingFor(fixture)
    expect(pending.approvalPolicy).toBe('MASTER_DEVICE')
    expect(pending.emailApprovalSentAt).toBeNull()
    expect(pending.pushNotificationsSentCount).toBe(1)
    expect(sendNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ token: `push-token-${fixture.masterId}` })
    )
    expect(
      sentEmails
        .flatMap((mail) => mail.Messages)
        .some((mail) => mail.To[0]?.Email === `${fixture.userId}@test.com`)
    ).toBe(false)
    expect(
      (await approve(fixture, pending.challengeId, fixture.otherId)).status
    ).toBe(400)
    await pendingFor(fixture)
    expect((await enroll(fixture, pending.challengeId)).status).toBe(401)
    expect(
      (await approve(fixture, pending.challengeId, fixture.masterId)).status
    ).toBe(200)
    expect(await challengeFor(fixture)).toMatchObject({
      status: 'approved',
      encryptionSalt: 'secret-salt',
      addDeviceSecretEncrypted: 'encrypted-enrollment'
    })
    expect((await enroll(fixture, pending.challengeId)).status).toBe(200)
    expect(sendNotification).toHaveBeenCalledTimes(1)
  })

  it('still notifies and accepts any active enrolled device under OTHER_DEVICE', async () => {
    const fixture = fixtures.other
    const pending = await pendingFor(fixture)
    expect(
      sendNotification.mock.calls
        .map(([notification]) => notification.token)
        .sort()
    ).toEqual(
      [fixture.masterId, fixture.otherId].map((id) => `push-token-${id}`).sort()
    )
    expect(
      (await approve(fixture, pending.challengeId, fixture.otherId)).status
    ).toBe(200)
    expect((await challengeFor(fixture)).status).toBe('approved')
  })

  it.each(['missing', 'loggedOut', 'deleted', 'noToken'] as const)(
    'never falls back to another device or email when the master is %s',
    async (name) => {
      const fixture = fixtures[name]
      const pending = await pendingFor(fixture)
      expect(sendNotification).not.toHaveBeenCalled()
      expect(pending.emailApprovalSentAt).toBeNull()
      expect(
        (await approve(fixture, pending.challengeId, fixture.otherId)).status
      ).toBe(400)
      await pendingFor(fixture)
      const expectedMasterStatus = {
        missing: 400,
        loggedOut: 401,
        deleted: 401,
        noToken: 200
      }
      expect(
        (await approve(fixture, pending.challengeId, fixture.masterId)).status
      ).toBe(expectedMasterStatus[name])
    }
  )

  it.each(['forged', 'emailGrant'])(
    'rejects stale %s grants at disclosure and enrollment',
    async (name) => {
      const fixture = fixtures[name]
      const pending = await pendingFor(fixture)
      await db
        .update(schema.decryptionChallenge)
        .set({
          approvedAt: new Date(),
          deviceApprovedAt: name === 'forged' ? new Date() : null,
          approvedFromDeviceId: name === 'forged' ? fixture.otherId : null,
          emailApprovedAt: name === 'emailGrant' ? new Date() : null
        })
        .where(eq(schema.decryptionChallenge.id, pending.challengeId))
      await pendingFor(fixture)
      expect((await enroll(fixture, pending.challengeId)).status).toBe(400)
    }
  )

  it('uses the current master after transfer and clears pending grants from the former master', async () => {
    const fixture = fixtures.transfer
    const pending = await pendingFor(fixture)
    expect(
      (await approve(fixture, pending.challengeId, fixture.masterId)).status
    ).toBe(200)
    const transfer = await request(
      'devices/setMaster',
      { newMasterDeviceId: fixture.otherId },
      fixture,
      fixture.masterId
    )
    expect(transfer.status, await transfer.clone().text()).toBe(200)
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
    ).toMatchObject({
      approvedAt: null,
      deviceApprovedAt: null,
      approvedFromDeviceId: null
    })
    await pendingFor(fixture)
    expect(
      (await approve(fixture, pending.challengeId, fixture.masterId)).status
    ).toBe(400)
    expect(
      (await approve(fixture, pending.challengeId, fixture.otherId)).status
    ).toBe(200)
    expect((await challengeFor(fixture)).status).toBe('approved')
    sendNotification.mockClear()
    await pendingFor({ ...fixture, newId: crypto.randomUUID() })
    expect(sendNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ token: `push-token-${fixture.otherId}` })
    )
  })

  it('never leaks verifier material for masterDeviceId or previously enrolled devices without fresh approval', async () => {
    const fixture = fixtures.other
    // Master device has no prior challenge: unauthenticated request stays pending.
    const masterPending = await pendingFor({
      ...fixture,
      newId: fixture.masterId
    })
    expect((await enroll(fixture, masterPending.challengeId)).status).toBe(401)

    // Secondary device goes through normal approval and completes login.
    const secondaryFixture = { ...fixture, newId: crypto.randomUUID() }
    const secondary = await pendingFor(secondaryFixture)
    expect(
      (await approve(secondaryFixture, secondary.challengeId, fixture.masterId))
        .status
    ).toBe(200)
    expect((await enroll(secondaryFixture, secondary.challengeId)).status).toBe(
      200
    )

    // Replaying requestDeviceChallenge unauthenticated with the enrolled deviceId
    // must create a new pending challenge instead of leaking salt/ciphertext.
    const replay = await pendingFor(secondaryFixture)
    expect(replay.challengeId).not.toBe(secondary.challengeId)
    expect((await enroll(secondaryFixture, replay.challengeId)).status).toBe(
      401
    )
  })

  it('resumes an active enrolled device via resumeDevice with its current enrollment secret only', async () => {
    const fixture = fixtures.other
    // The preceding test rotated fixtures.other's secret to 'next-secret'.
    const resume = (secret: string, deviceId = fixture.masterId) =>
      request(
        'auth/resumeDevice',
        {
          email: `${fixture.userId}@test.com`,
          deviceInput: { id: deviceId, name: 'Master', platform: 'test' },
          currentAddDeviceSecret: secret,
          input: {
            firebaseToken: null,
            devicePlatform: 'test',
            encryptionSalt: 'secret-salt',
            addDeviceSecret: 'resumed-secret',
            addDeviceSecretEncrypted: 'resumed-encrypted'
          }
        },
        fixture
      )

    expect((await resume('wrong-secret')).status).toBe(401)
    const ok = await resume('next-secret')
    expect(ok.status, await ok.clone().text()).toBe(200)
    const body = (await ok.json()) as Record<string, unknown>
    expect(body).not.toHaveProperty('encryptionSalt')
    expect(body).not.toHaveProperty('addDeviceSecretEncrypted')
    expect((await resume('next-secret')).status).toBe(401)

    // Logged-out and deleted devices cannot resume even with the current secret.
    expect((await resume('resumed-secret', fixture.otherId)).status).toBe(200)
    await db
      .update(schema.device)
      .set({ logoutAt: new Date() })
      .where(eq(schema.device.id, fixture.otherId))
    expect((await resume('resumed-secret', fixture.otherId)).status).toBe(401)
  })
})
