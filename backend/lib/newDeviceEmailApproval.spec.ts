import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { RootResolver } from '../schemas/RootResolver'
import { plainToInstance } from 'class-transformer'
import { buildApp } from '../app'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { sentEmails } from '../utils/email'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeMutation
} from '../models/DecryptionChallenge'
import { UserMutation } from '../models/UserMutation'
import { UserNewDevicePolicyGQL } from '../models/types/UserNewDevicePolicy'
import { requestDeviceChallengeResultSchema } from '../../shared/orpc/schemas'
import type { NewDeviceApprovalPolicy } from '../../shared/newDeviceApproval'
import {
  hashDeviceApprovalToken,
  sendNewDeviceApprovalEmail
} from './newDeviceEmailApproval'
import { initiateReset } from './masterDeviceReset'

vi.mock('./getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))

afterEach(() => vi.unstubAllEnvs())

const app = buildApp()
const cases = {
  email: 'EMAIL',
  returning: 'EMAIL',
  unconfigured: null,
  noMaster: 'EMAIL',
  andEmailFirst: 'EMAIL_AND_OTHER_DEVICE',
  andDeviceFirst: 'EMAIL_AND_OTHER_DEVICE',
  orEmail: 'EMAIL_OR_OTHER_DEVICE',
  orDevice: 'EMAIL_OR_OTHER_DEVICE',
  expiry: 'EMAIL',
  rejected: 'EMAIL',
  changed: 'EMAIL_AND_OTHER_DEVICE',
  forged: 'EMAIL',
  scanner: 'EMAIL',
  reset: 'EMAIL',
  concurrent: 'EMAIL',
  delivery: 'EMAIL',
  emailChanged: 'EMAIL',
  staleGrant: 'EMAIL_AND_OTHER_DEVICE',
  releaseRace: 'EMAIL',
  revoked: 'EMAIL',
  foreign: 'EMAIL',
  otherOnly: 'OTHER_DEVICE',
  emailReject: 'EMAIL',
  andReject: 'EMAIL_AND_OTHER_DEVICE',
  rejectExpired: 'EMAIL',
  rejectOrigin: 'EMAIL',
  rejectScanner: 'EMAIL',
  rejectApproved: 'EMAIL',
  decisionRace: 'EMAIL'
} satisfies Record<string, NewDeviceApprovalPolicy | null>

const fixtures = Object.fromEntries(
  Object.entries(cases).map(([name, policy]) => [
    name,
    {
      userId: crypto.randomUUID(),
      masterId: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
      policy
    }
  ])
)
type Fixture = (typeof fixtures)[string]

// The configured testEnv creates and closes an in-memory PGlite database.
beforeAll(async () => {
  for (const [name, fixture] of Object.entries(fixtures)) {
    await db.insert(schema.user).values({
      id: fixture.userId,
      email: `${fixture.userId}@test.com`,
      addDeviceSecret: createHash('sha256')
        .update('synthetic-enrollment-secret')
        .digest('hex'),
      addDeviceSecretEncrypted: 'encrypted-enrollment-test-secret',
      encryptionSalt: 'test-salt',
      loginCredentialsLimit: 50,
      TOTPlimit: 10,
      deviceRecoveryCooldownMinutes: 960,
      newDevicePolicy: fixture.policy
    })
    if (name === 'noMaster') continue
    await db.insert(schema.device).values({
      id: fixture.masterId,
      userId: fixture.userId,
      name: 'Existing Authier device',
      platform: 'test',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      ...defaultDeviceSettingSystemValues
    })
    await db
      .update(schema.user)
      .set({ masterDeviceId: fixture.masterId })
      .where(eq(schema.user.id, fixture.userId))
  }
})

const requestChallengeResponse = (fixture: Fixture) =>
  app.handle(
    new Request('https://api.authier.pm/api/v1/auth/requestDeviceChallenge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '127.0.0.1'
      },
      body: JSON.stringify({
        email: `${fixture.userId}@test.com`,
        deviceInput: {
          id: fixture.deviceId,
          name: '<img src=x onerror=alert(1)> New laptop',
          platform: 'test'
        }
      })
    })
  )

const requestChallenge = async (fixture: Fixture) => {
  const response = await requestChallengeResponse(fixture)
  expect(response.status, await response.clone().text()).toBe(200)
  return requestDeviceChallengeResultSchema.parse(await response.json())
}

const assertPending = (
  result: Awaited<ReturnType<typeof requestChallenge>>
) => {
  expect(result.status).toBe('pending')
  expect(result).not.toHaveProperty('encryptionSalt')
  expect(result).not.toHaveProperty('addDeviceSecretEncrypted')
  if (result.status !== 'pending') throw new Error('Expected pending approval')
  return result
}

const latestToken = (fixture: Fixture) => {
  const message = sentEmails
    .flatMap((mail) => mail.Messages)
    .filter((mail) => mail.To[0]?.Email === `${fixture.userId}@test.com`)
    .at(-1)
  expect(message?.HTMLPart).not.toContain('<img src=x')
  const token = message?.TextPart.match(
    /approve-new-device#token=([a-f0-9]{64})/
  )?.[1]
  if (!token) throw new Error('Missing approval email token')
  return token
}

const confirm = (token: string) =>
  app.handle(
    new Request('https://api.authier.pm/approve-new-device', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://api.authier.pm'
      },
      body: new URLSearchParams({ token })
    })
  )

const rejectFromEmail = (token: string, origin = 'https://api.authier.pm') =>
  app.handle(
    new Request('https://api.authier.pm/reject-new-device', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
      body: new URLSearchParams({ token })
    })
  )

const approveFromDevice = async (fixture: Fixture, challengeId: number) => {
  const device = await db.query.device.findFirst({
    where: { id: fixture.masterId }
  })
  if (!device) throw new Error('Missing master device')
  return plainToInstance(DecryptionChallengeMutation, {
    id: challengeId
  }).approve(makeFakeCtx({ userId: fixture.userId, device }))
}

describe('new device email approval', () => {
  it.each(['email', 'unconfigured', 'noMaster'])(
    'requires email approval for %s before returning password-guessing material',
    async (name) => {
      const fixture = fixtures[name]
      const pending = assertPending(await requestChallenge(fixture))
      expect(pending.approvalPolicy).toBe('EMAIL')
      const token = latestToken(fixture)
      const stored = await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
      expect(stored?.emailApprovalTokenHash).toBe(
        hashDeviceApprovalToken(token)
      )
      expect(stored?.emailApprovalTokenHash).not.toBe(token)
      expect(stored?.approvedAt).toBeNull()
      const count = sentEmails.length
      assertPending(await requestChallenge(fixture))
      expect(sentEmails).toHaveLength(count)
      expect((await confirm(token)).status).toBe(200)
      expect(await requestChallenge(fixture)).toMatchObject({
        status: 'approved',
        encryptionSalt: 'test-salt',
        addDeviceSecretEncrypted: 'encrypted-enrollment-test-secret'
      })
      expect((await confirm(token)).status).toBe(400)
    }
  )

  it('does not approve on GET and escapes device names in the confirmation page', async () => {
    const fixture = fixtures.scanner
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const response = await app.handle(
      new Request('https://api.authier.pm/approve-new-device')
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('content-security-policy')).toContain(
      "frame-ancestors 'none'"
    )
    const html = await response.text()
    expect(html).toContain('method="post"')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('location.hash')
    expect(html).not.toContain(token)
    const review = await app.handle(
      new Request('https://api.authier.pm/approve-new-device/review', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://api.authier.pm'
        },
        body: JSON.stringify({ token })
      })
    )
    expect(review.status).toBe(200)
    expect(await review.json()).toMatchObject({
      deviceName: '<img src=x onerror=alert(1)> New laptop'
    })
    expect(
      (
        await db.query.decryptionChallenge.findFirst({
          where: { id: pending.challengeId }
        })
      )?.approvedAt
    ).toBeNull()
    assertPending(await requestChallenge(fixture))
  })

  it.each(['andEmailFirst', 'andDeviceFirst'])(
    'requires both grants with %s',
    async (name) => {
      const fixture = fixtures[name]
      const pending = assertPending(await requestChallenge(fixture))
      const token = latestToken(fixture)
      const emailFirst = name === 'andEmailFirst'
      if (emailFirst) await confirm(token)
      else await approveFromDevice(fixture, pending.challengeId)
      const partial = assertPending(await requestChallenge(fixture))
      expect(Boolean(partial.emailApprovedAt)).toBe(emailFirst)
      expect(Boolean(partial.deviceApprovedAt)).toBe(!emailFirst)
      if (emailFirst) await approveFromDevice(fixture, pending.challengeId)
      else await confirm(token)
      expect((await requestChallenge(fixture)).status).toBe('approved')
    }
  )

  it.each(['orEmail', 'orDevice'])(
    'accepts either configured method with %s',
    async (name) => {
      const fixture = fixtures[name]
      const pending = assertPending(await requestChallenge(fixture))
      const token = latestToken(fixture)
      if (name === 'orEmail') await confirm(token)
      else await approveFromDevice(fixture, pending.challengeId)
      expect((await requestChallenge(fixture)).status).toBe('approved')
      expect((await confirm(token)).status).toBe(400)
    }
  )

  it('expires tokens and replaces them without making an old link valid again', async () => {
    const fixture = fixtures.expiry
    const pending = assertPending(await requestChallenge(fixture))
    const oldToken = latestToken(fixture)
    await db
      .update(schema.decryptionChallenge)
      .set({
        emailApprovalExpiresAt: new Date(Date.now() - 1000),
        emailApprovalSentAt: new Date(Date.now() - 120_000)
      })
      .where(eq(schema.decryptionChallenge.id, pending.challengeId))
    expect((await confirm(oldToken)).status).toBe(400)
    assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    expect(token).not.toBe(oldToken)
    expect((await confirm(oldToken)).status).toBe(400)
    expect((await confirm(token)).status).toBe(200)
  })

  it('does not permit another-device approval when email alone is selected', async () => {
    const fixture = fixtures.forged
    const pending = assertPending(await requestChallenge(fixture))
    await expect(
      approveFromDevice(fixture, pending.challengeId)
    ).rejects.toThrow('not enabled')
    expect((await confirm('a'.repeat(64))).status).toBe(400)
    assertPending(await requestChallenge(fixture))
  })

  it('invalidates an email link when the request is rejected', async () => {
    const fixture = fixtures.rejected
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const device = await db.query.device.findFirst({
      where: { id: fixture.masterId }
    })
    if (!device) throw new Error('Missing master device')
    await plainToInstance(DecryptionChallengeMutation, {
      id: pending.challengeId,
      userId: fixture.userId
    }).reject(makeFakeCtx({ userId: fixture.userId, device }))
    expect((await confirm(token)).status).toBe(400)
  })

  it('invalidates tokens and partial grants when approval preferences change', async () => {
    const fixture = fixtures.changed
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    await approveFromDevice(fixture, pending.challengeId)
    const user = await db.query.user.findFirst({
      where: { id: fixture.userId }
    })
    const device = await db.query.device.findFirst({
      where: { id: fixture.masterId }
    })
    if (!user || !device) throw new Error('Missing account')
    await plainToInstance(UserMutation, user).setNewDevicePolicy(
      UserNewDevicePolicyGQL.OTHER_DEVICE,
      makeFakeCtx({ userId: fixture.userId, device })
    )
    expect((await confirm(token)).status).toBe(400)
    const result = assertPending(await requestChallenge(fixture))
    expect(result.emailApprovedAt).toBeNull()
    expect(result.deviceApprovedAt).toBeNull()
    await approveFromDevice(fixture, pending.challengeId)
    expect((await requestChallenge(fixture)).status).toBe('approved')
  })

  it('does not email an account that only allows another device', async () => {
    const fixture = fixtures.otherOnly
    const count = sentEmails.length
    const pending = assertPending(await requestChallenge(fixture))
    expect(sentEmails).toHaveLength(count)
    await approveFromDevice(fixture, pending.challengeId)
    expect((await requestChallenge(fixture)).status).toBe('approved')
  })
  it('consumes a token only once when confirmation requests race', async () => {
    const fixture = fixtures.concurrent
    assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const responses = await Promise.all([confirm(token), confirm(token)])
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400
    ])
    expect((await requestChallenge(fixture)).status).toBe('approved')
  })

  it('requires a fresh email approval after logout and completes re-enrollment', async () => {
    const fixture = fixtures.returning
    const old = assertPending(await requestChallenge(fixture))
    await db
      .update(schema.decryptionChallenge)
      .set({ createdAt: new Date(Date.now() - 2000) })
      .where(eq(schema.decryptionChallenge.id, old.challengeId))
    await db.insert(schema.device).values({
      id: fixture.deviceId,
      userId: fixture.userId,
      name: 'Returning browser',
      platform: 'test',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      logoutAt: new Date(Date.now() - 1000),
      ...defaultDeviceSettingSystemValues
    })
    expect((await confirm(latestToken(fixture))).status).toBe(400)
    const fresh = assertPending(await requestChallenge(fixture))
    expect(fresh.challengeId).not.toBe(old.challengeId)
    expect((await confirm(latestToken(fixture))).status).toBe(200)
    expect((await requestChallenge(fixture)).status).toBe('approved')
    const challenge = await db.query.decryptionChallenge.findFirst({
      where: { id: fresh.challengeId }
    })
    const login = await plainToInstance(
      DecryptionChallengeApproved,
      challenge
    ).addNewDeviceForUser(
      {
        addDeviceSecret: 'returning-secret',
        addDeviceSecretEncrypted: 'returning-encrypted',
        encryptionSalt: 'salt',
        devicePlatform: 'test',
        firebaseToken: null
      },
      'synthetic-enrollment-secret',
      makeFakeCtx({ userId: fixture.userId })
    )
    expect(login.accessToken).toBeTruthy()
    expect(
      await db.query.device.findFirst({ where: { id: fixture.deviceId } })
    ).toMatchObject({
      logoutAt: null,
      resumeSecretHash: expect.any(String)
    })
  })

  it.each(['revoked', 'foreign'])(
    'rejects an email token after its requested device becomes %s',
    async (name) => {
      const fixture = fixtures[name]
      const pending = assertPending(await requestChallenge(fixture))
      const token = latestToken(fixture)
      const requested = await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
      if (!requested) throw new Error('Missing challenge')
      await db.insert(schema.device).values({
        id: fixture.deviceId,
        userId: name === 'foreign' ? fixtures.email.userId : fixture.userId,
        name: 'Revoked or foreign device',
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        logoutAt:
          name === 'revoked'
            ? new Date(requested.createdAt.getTime() + 1)
            : null,
        ...defaultDeviceSettingSystemValues
      })
      expect((await confirm(token)).status).toBe(400)
      expect(
        (
          await db.query.decryptionChallenge.findFirst({
            where: { id: pending.challengeId }
          })
        )?.approvedAt
      ).toBeNull()
    }
  )

  it('does not let an email login link bypass a pending recovery waiting period', async () => {
    const fixture = fixtures.reset
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    await initiateReset(
      makeFakeCtx({ userId: fixture.userId }),
      `${fixture.userId}@test.com`,
      fixture.deviceId,
      pending.challengeId
    )
    expect((await confirm(token)).status).toBe(400)
    expect(
      (
        await db.query.decryptionChallenge.findFirst({
          where: { id: pending.challengeId }
        })
      )?.approvedAt
    ).toBeNull()
  })

  it('fails closed instead of silently suppressing required production email delivery', async () => {
    const fixture = fixtures.delivery
    const [challenge] = await db
      .insert(schema.decryptionChallenge)
      .values({
        userId: fixture.userId,
        deviceId: fixture.deviceId,
        deviceName: 'Delivery test',
        ipAddress: '127.0.0.1'
      })
      .returning()
    const before = sentEmails.length
    vi.stubEnv('NODE_ENV', 'production')
    await expect(sendNewDeviceApprovalEmail(db, challenge.id)).rejects.toThrow(
      'Email approval delivery is disabled'
    )
    expect(sentEmails).toHaveLength(before)
    const stored = await db.query.decryptionChallenge.findFirst({
      where: { id: challenge.id }
    })
    expect(stored?.approvedAt).toBeNull()
    expect(stored?.emailApprovalTokenHash).toBeNull()
    expect(stored?.emailApprovalSentAt).toBeNull()
  })
  it('invalidates links sent to the old address when the account email changes', async () => {
    const fixture = fixtures.emailChanged
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const user = await db.query.user.findFirst({
      where: { id: fixture.userId }
    })
    const device = await db.query.device.findFirst({
      where: { id: fixture.masterId }
    })
    if (!user || !device) throw new Error('Missing account')
    await plainToInstance(UserMutation, user).changeEmail(
      `${crypto.randomUUID()}@test.com`,
      makeFakeCtx({ userId: fixture.userId, device })
    )
    expect((await confirm(token)).status).toBe(400)
    expect(
      (
        await db.query.decryptionChallenge.findFirst({
          where: { id: pending.challengeId }
        })
      )?.emailApprovalTokenHash
    ).toBeNull()
  })
  it('requires current policy evidence even if an approved timestamp is stale', async () => {
    const fixture = fixtures.staleGrant
    const pending = assertPending(await requestChallenge(fixture))
    await db
      .update(schema.decryptionChallenge)
      .set({ approvedAt: new Date(), emailApprovedAt: new Date() })
      .where(eq(schema.decryptionChallenge.id, pending.challengeId))
    assertPending(await requestChallenge(fixture))
    const response = await app.handle(
      new Request('https://api.authier.pm/api/v1/auth/completeDeviceLogin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': '127.0.0.1'
        },
        body: JSON.stringify({
          challengeId: pending.challengeId,
          currentAddDeviceSecret: 'synthetic-enrollment-secret',
          input: {
            firebaseToken: null,
            devicePlatform: 'test',
            encryptionSalt: 'test-salt',
            addDeviceSecret: 'replacement-secret',
            addDeviceSecretEncrypted: 'encrypted-replacement'
          }
        })
      })
    )
    expect(response.status).toBe(400)
    expect(
      await db.query.device.findFirst({ where: { id: fixture.deviceId } })
    ).toBeUndefined()
  })

  it('rechecks a rejection that commits after the initial approved challenge read', async () => {
    const fixture = fixtures.releaseRace
    const pending = assertPending(await requestChallenge(fixture))
    await confirm(latestToken(fixture))
    const original = db.query.decryptionChallenge.findFirst.bind(
      db.query.decryptionChallenge
    )
    let rejected = false
    const challengeQueries = new Proxy(db.query.decryptionChallenge, {
      get(target, property) {
        if (property !== 'findFirst') return Reflect.get(target, property)
        return async (...args: Parameters<typeof original>) => {
          const snapshot = await original(...args)
          if (snapshot?.id === pending.challengeId && !rejected) {
            rejected = true
            await db
              .update(schema.decryptionChallenge)
              .set({ rejectedAt: new Date(), approvedAt: null })
              .where(eq(schema.decryptionChallenge.id, pending.challengeId))
          }
          return snapshot
        }
      }
    })
    const queries = new Proxy(db.query, {
      get(target, property) {
        return property === 'decryptionChallenge'
          ? challengeQueries
          : Reflect.get(target, property)
      }
    })
    const racingDb = new Proxy(db, {
      get(target, property) {
        return property === 'query' ? queries : Reflect.get(target, property)
      }
    })
    await expect(
      new RootResolver().deviceDecryptionChallenge(
        `${fixture.userId}@test.com`,
        { id: fixture.deviceId, name: 'New laptop', platform: 'test' },
        { ...makeFakeCtx({ userId: fixture.userId }), db: racingDb }
      )
    ).rejects.toThrow('Login failed')
    expect(rejected).toBe(true)
  })
  it.each(['emailReject', 'andReject'])(
    'rejects the exact request and clears its approvals with %s',
    async (name) => {
      const fixture = fixtures[name]
      const pending = assertPending(await requestChallenge(fixture))
      const token = latestToken(fixture)
      const message = sentEmails
        .flatMap((mail) => mail.Messages)
        .filter((mail) => mail.To[0]?.Email === `${fixture.userId}@test.com`)
        .at(-1)
      expect(message?.TextPart).toContain(
        `/approve-new-device#token=${token}&action=reject`
      )
      expect(message?.HTMLPart).toContain('reject this device</a>')
      if (name === 'andReject')
        await approveFromDevice(fixture, pending.challengeId)
      const [unrelated] = await db
        .insert(schema.decryptionChallenge)
        .values({
          userId: fixture.userId,
          deviceId: crypto.randomUUID(),
          deviceName: 'Another request',
          ipAddress: '127.0.0.2'
        })
        .returning()
      const response = await rejectFromEmail(token)
      expect(response.status).toBe(200)
      expect(await response.text()).toContain('Device rejected')
      expect(
        await db.query.decryptionChallenge.findFirst({
          where: { id: pending.challengeId }
        })
      ).toMatchObject({
        rejectedAt: expect.any(Date),
        blockIp: true,
        approvedAt: null,
        emailApprovedAt: null,
        deviceApprovedAt: null,
        approvedFromDeviceId: null,
        approvedByRecovery: false,
        emailApprovalTokenHash: null,
        emailApprovalExpiresAt: null
      })
      expect(
        await db.query.decryptionChallenge.findFirst({
          where: { id: unrelated.id }
        })
      ).toEqual(unrelated)
      expect((await rejectFromEmail(token)).status).toBe(400)
      expect((await confirm(token)).status).toBe(400)
      const poll = await requestChallengeResponse(fixture)
      expect(poll.status).toBe(400)
      const body = await poll.text()
      expect(body).not.toContain('encryptionSalt')
      expect(body).not.toContain('addDeviceSecretEncrypted')
    }
  )

  it('does not reject on GET or a read-only review request', async () => {
    const fixture = fixtures.rejectScanner
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const page = await app.handle(
      new Request('https://api.authier.pm/approve-new-device')
    )
    expect(page.status).toBe(200)
    const html = await page.text()
    expect(html).toContain('formaction="/reject-new-device"')
    expect(html).not.toContain(token)
    const review = await app.handle(
      new Request('https://api.authier.pm/approve-new-device/review', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://api.authier.pm'
        },
        body: JSON.stringify({ token, action: 'reject' })
      })
    )
    expect(review.status).toBe(200)
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
    ).toMatchObject({
      approvedAt: null,
      rejectedAt: null,
      blockIp: null,
      emailApprovalTokenHash: hashDeviceApprovalToken(token)
    })
  })

  it('rejects expired and forged rejection tokens without changing the request', async () => {
    const fixture = fixtures.rejectExpired
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const forged = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect((await rejectFromEmail(forged)).status).toBe(400)
    expect((await rejectFromEmail('not-a-token')).status).toBe(400)
    await db
      .update(schema.decryptionChallenge)
      .set({ emailApprovalExpiresAt: new Date(Date.now() - 1) })
      .where(eq(schema.decryptionChallenge.id, pending.challengeId))
    expect((await rejectFromEmail(token)).status).toBe(400)
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
    ).toMatchObject({
      approvedAt: null,
      rejectedAt: null,
      blockIp: null,
      emailApprovalTokenHash: hashDeviceApprovalToken(token)
    })
  })

  it('rejects foreign origins without consuming the rejection token', async () => {
    const fixture = fixtures.rejectOrigin
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    expect(
      (await rejectFromEmail(token, 'https://attacker.example')).status
    ).toBe(400)
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
    ).toMatchObject({
      rejectedAt: null,
      emailApprovalTokenHash: hashDeviceApprovalToken(token)
    })
    expect((await rejectFromEmail(token)).status).toBe(200)
  })

  it('does not turn a consumed approval token into a device revocation token', async () => {
    const fixture = fixtures.rejectApproved
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    expect((await confirm(token)).status).toBe(200)
    expect((await rejectFromEmail(token)).status).toBe(400)
    expect(
      await db.query.decryptionChallenge.findFirst({
        where: { id: pending.challengeId }
      })
    ).toMatchObject({
      approvedAt: expect.any(Date),
      rejectedAt: null,
      blockIp: null
    })
    expect((await requestChallenge(fixture)).status).toBe('approved')
  })

  it('commits only one decision when approval and rejection race', async () => {
    const fixture = fixtures.decisionRace
    const pending = assertPending(await requestChallenge(fixture))
    const token = latestToken(fixture)
    const responses = await Promise.all([
      confirm(token),
      rejectFromEmail(token)
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400
    ])
    const row = await db.query.decryptionChallenge.findFirst({
      where: { id: pending.challengeId }
    })
    expect(
      Number(Boolean(row?.approvedAt)) + Number(Boolean(row?.rejectedAt))
    ).toBe(1)
    expect(row?.emailApprovalTokenHash).toBeNull()
    expect(Boolean(row?.rejectedAt)).toBe(row?.blockIp === true)
    expect((await confirm(token)).status).toBe(400)
    expect((await rejectFromEmail(token)).status).toBe(400)
  })
})
