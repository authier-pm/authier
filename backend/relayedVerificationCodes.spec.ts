import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { sign } from 'jsonwebtoken'
import { buildApp } from './app'
import { db } from './prisma/prismaClient'
import * as schema from './drizzle/schema'
import { defaultDeviceSettingSystemValues } from './models/defaultDeviceSettingSystemValues'
import {
  MAX_ACTIVE_RELAYED_CODES,
  RELAYED_CODE_LIFETIME_MS
} from '../shared/relayedVerificationCode'
import { purgeExpiredRelayedCodes } from './lib/relayedVerificationCodes'

vi.mock('./lib/getGeoIpLocation', () => ({
  getGeoIpLocation: { memoized: async () => null }
}))

const app = buildApp()
const userId = crypto.randomUUID()
const phoneId = crypto.randomUUID()
const browserId = crypto.randomUUID()
const otherUserId = crypto.randomUUID()
const otherPhoneId = crypto.randomUUID()
const tokenFor = (user: string, deviceId: string) =>
  sign(
    { userId: user, deviceId, tokenVersion: 0 },
    process.env.ACCESS_TOKEN_SECRET!
  )
const phoneToken = tokenFor(userId, phoneId)
const browserToken = tokenFor(userId, browserId)
const otherPhoneToken = tokenFor(otherUserId, otherPhoneId)
// Shape of a real envelope: base64 of salt, IV, ciphertext and tag.
const ciphertext = (label: string) =>
  Buffer.from(`${label}`.padEnd(60, '.')).toString('base64')

// testEnv creates PGlite with setupTestDb in beforeAll and closes it in afterAll.
beforeAll(async () => {
  await db.insert(schema.user).values(
    [userId, otherUserId].map((id) => ({
      id,
      email: `${id}@test.com`,
      addDeviceSecret: 'hash',
      addDeviceSecretEncrypted: 'encrypted',
      encryptionSalt: 'salt',
      loginCredentialsLimit: 100,
      TOTPlimit: 100,
      deviceRecoveryCooldownMinutes: 960
    }))
  )
  await db.insert(schema.device).values(
    [
      [phoneId, userId, 'Pixel 9'],
      [browserId, userId, 'Chrome extension'],
      [otherPhoneId, otherUserId, 'Other phone']
    ].map(([id, owner, name]) => ({
      id,
      userId: owner,
      name,
      platform: 'android',
      firstIpAddress: '127.0.0.1',
      lastIpAddress: '127.0.0.1',
      ...defaultDeviceSettingSystemValues
    }))
  )
})

const relay = (input: unknown, token?: string) =>
  app.handle(
    new Request('http://authier.test/api/v1/verificationCodes/relay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '127.0.0.1',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(input)
    })
  )

const listCodes = async (token: string) => {
  const response = await app.handle(
    new Request('http://authier.test/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        query:
          '{ me { relayedVerificationCodes { id encrypted createdAt expiresAt deviceName } } }'
      })
    })
  )
  const result = await response.json()
  expect(result.errors).toBeUndefined()
  return result.data.me.relayedVerificationCodes as Array<{
    id: string
    encrypted: string
    createdAt: string
    expiresAt: string
    deviceName: string
  }>
}

describe('relayed verification codes', () => {
  it('requires an authenticated device and a well-formed envelope', async () => {
    const input = { id: crypto.randomUUID(), encrypted: ciphertext('a') }
    expect((await relay(input)).status).toBe(401)
    for (const invalid of [
      { ...input, id: 'not-a-uuid' },
      { ...input, encrypted: 'short' },
      { ...input, encrypted: `${ciphertext('a')}!` },
      { ...input, encrypted: 'A'.repeat(4096) }
    ]) {
      expect((await relay(invalid, phoneToken)).status).toBe(400)
    }
    expect(await listCodes(browserToken)).toEqual([])
  })

  it('shows a phone relay to the account’s browsers only, idempotently', async () => {
    const id = crypto.randomUUID()
    const input = { id, encrypted: ciphertext('first') }
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await relay(input, phoneToken)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ ok: true })
    }
    const [code, ...rest] = await listCodes(browserToken)
    expect(rest).toEqual([])
    expect(code).toMatchObject({
      id,
      encrypted: input.encrypted,
      deviceName: 'Pixel 9'
    })
    expect(Date.parse(code.expiresAt) - Date.parse(code.createdAt)).toBe(
      RELAYED_CODE_LIFETIME_MS
    )
    expect(await listCodes(otherPhoneToken)).toEqual([])

    // The same client id from another account never collides or leaks.
    expect(
      (await relay({ id, encrypted: ciphertext('other') }, otherPhoneToken))
        .status
    ).toBe(200)
    expect((await listCodes(otherPhoneToken))[0].encrypted).toBe(
      ciphertext('other')
    )
    expect((await listCodes(browserToken))[0].encrypted).toBe(input.encrypted)
  })

  it('hides expired codes and deletes their ciphertext on the next relay', async () => {
    const expiredId = crypto.randomUUID()
    await db.insert(schema.relayedVerificationCode).values({
      userId,
      id: expiredId,
      deviceId: phoneId,
      encrypted: ciphertext('expired'),
      createdAt: new Date(Date.now() - RELAYED_CODE_LIFETIME_MS - 1000),
      expiresAt: new Date(Date.now() - 1000)
    })
    expect((await listCodes(browserToken)).map(({ id }) => id)).not.toContain(
      expiredId
    )
    await relay(
      { id: crypto.randomUUID(), encrypted: ciphertext('fresh') },
      phoneToken
    )
    expect(
      await db.query.relayedVerificationCode.findFirst({
        where: { id: expiredId }
      })
    ).toBeUndefined()
  })

  it('purges expired codes from the cron even when nobody relays', async () => {
    const expiredId = crypto.randomUUID()
    const liveId = crypto.randomUUID()
    await db.insert(schema.relayedVerificationCode).values(
      [
        [expiredId, Date.now() - 1000],
        [liveId, Date.now() + RELAYED_CODE_LIFETIME_MS]
      ].map(([id, expiresAt]) => ({
        userId,
        id: id as string,
        deviceId: phoneId,
        encrypted: ciphertext(String(id)),
        expiresAt: new Date(expiresAt)
      }))
    )
    expect(await purgeExpiredRelayedCodes()).toBe(1)
    const remaining = await db.query.relayedVerificationCode.findMany({
      where: { id: { in: [expiredId, liveId] } }
    })
    expect(remaining.map(({ id }) => id)).toEqual([liveId])
  })

  it('limits waiting codes per account without rejecting retries', async () => {
    await db
      .delete(schema.relayedVerificationCode)
      .where(eq(schema.relayedVerificationCode.userId, userId))
    const ids = Array.from({ length: MAX_ACTIVE_RELAYED_CODES }, () =>
      crypto.randomUUID()
    )
    for (const id of ids) {
      expect(
        (await relay({ id, encrypted: ciphertext(id) }, phoneToken)).status
      ).toBe(200)
    }
    expect(
      (
        await relay(
          { id: crypto.randomUUID(), encrypted: ciphertext('over') },
          phoneToken
        )
      ).status
    ).toBe(429)
    expect(
      (await relay({ id: ids[0], encrypted: ciphertext(ids[0]) }, phoneToken))
        .status
    ).toBe(200)
    expect(await listCodes(browserToken)).toHaveLength(MAX_ACTIVE_RELAYED_CODES)
  })

  it('removes relayed codes with the device that sent them', async () => {
    await db.delete(schema.device).where(eq(schema.device.id, phoneId))
    expect(await listCodes(browserToken)).toEqual([])
  })
})
