import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { readFileSync } from 'node:fs'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import * as email from '../utils/email'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import {
  actOnReset,
  confirmReset,
  initiateReset,
  updateResetConfig
} from './masterDeviceReset'
import { processDueResets } from './processPendingMasterDeviceResets'
import {
  defaultMasterDeviceResetConfig,
  masterDeviceResetConfigSchema
} from '../../shared/masterDeviceResetConfig'
import { RootResolver } from '../schemas/RootResolver'
import { DecryptionChallengeMutation } from '../models/DecryptionChallenge'

const fixture = async (requiredApprovals = 1, waitMinutes = 2880) => {
  const userId = crypto.randomUUID()
  const [user] = await db
    .insert(schema.user)
    .values({
      id: userId,
      email: `${userId}@example.com`,
      addDeviceSecret: 'hash',
      addDeviceSecretEncrypted: 'encrypted',
      encryptionSalt: 'salt',
      TOTPlimit: 10,
      loginCredentialsLimit: 50,
      deviceRecoveryCooldownMinutes: waitMinutes,
      masterDeviceResetConfig: {
        requiredApprovals,
        waitMinutes,
        notificationEmails: ['backup@example.com', 'BACKUP@example.com']
      }
    })
    .returning()
  const devices = await db
    .insert(schema.device)
    .values(
      ['master', 'other', 'third'].map((name) => ({
        id: crypto.randomUUID(),
        userId,
        name,
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        ...defaultDeviceSettingSystemValues
      }))
    )
    .returning()
  await db
    .update(schema.user)
    .set({ masterDeviceId: devices[0]!.id })
    .where(eq(schema.user.id, userId))
  const [challenge] = await db
    .insert(schema.decryptionChallenge)
    .values({
      userId,
      deviceId: crypto.randomUUID(),
      deviceName: 'replacement',
      ipAddress: '127.0.0.1'
    })
    .returning()
  const ctx = makeFakeCtx({ userId, device: devices[1]! })
  return { user: user!, devices, challenge: challenge!, ctx }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
const start = async (f: Fixture) => {
  await initiateReset(
    f.ctx,
    f.user.email!,
    f.challenge.deviceId,
    f.challenge.id
  )
  const message = email.sentEmails.at(-1)!.Messages[0]!.TextPart
  const token = message.match(/token=([^\s]+)/)![1]!
  const [request] = await db
    .select()
    .from(schema.masterDeviceResetRequest)
    .where(eq(schema.masterDeviceResetRequest.userId, f.user.id))
  return { token, request: request! }
}
const current = async (f: Fixture) =>
  db.query.user.findFirst({ where: { id: f.user.id } })

// tests/testEnv.ts creates a fresh PGlite in beforeAll and closes it in afterAll.
describe('master device recovery', () => {
  const fixtures: Fixture[] = []
  beforeAll(async () => {
    for (let i = 0; i < 12; i++) fixtures.push(await fixture())
  })

  it('migrates legacy recovery settings without imposing new approval requirements', async () => {
    const migration = readFileSync(
      new URL(
        '../drizzle/migrations/20260920103231_aberrant_carmella_unuscione/migration.sql',
        import.meta.url
      ),
      'utf8'
    )
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw('CREATE SCHEMA recovery_migration_test'))
      await tx.execute(
        sql.raw('SET LOCAL search_path TO recovery_migration_test, public')
      )
      await tx.execute(
        sql.raw(
          'CREATE TABLE "User" (id uuid PRIMARY KEY, "deviceRecoveryCooldownMinutes" integer NOT NULL)'
        )
      )
      await tx.execute(
        sql.raw(
          'CREATE TABLE "MasterDeviceResetRequest" ("userId" uuid NOT NULL)'
        )
      )
      const id = crypto.randomUUID()
      await tx.execute(sql`INSERT INTO "User" VALUES (${id}, 960)`)
      await tx.execute(
        sql`INSERT INTO "MasterDeviceResetRequest" VALUES (${id})`
      )
      for (const statement of migration.split('--> statement-breakpoint'))
        await tx.execute(sql.raw(statement))
      const rows = await tx.select().from(schema.masterDeviceResetEmail)
      expect(rows).toEqual([])
      const users = await tx
        .select({
          masterDeviceResetConfig: schema.user.masterDeviceResetConfig
        })
        .from(schema.user)
      expect(users[0]?.masterDeviceResetConfig).toEqual({
        requiredApprovals: 0,
        waitMinutes: 960,
        notificationEmails: []
      })
      const requests = await tx
        .select({ config: schema.masterDeviceResetRequest.config })
        .from(schema.masterDeviceResetRequest)
      expect(requests[0]?.config).toEqual(users[0]?.masterDeviceResetConfig)
      await tx.execute(sql.raw('SET LOCAL search_path TO public'))
      await tx.execute(sql.raw('DROP SCHEMA recovery_migration_test CASCADE'))
    })
  })

  it('validates boundaries and rejects malformed email addresses', () => {
    for (const requiredApprovals of [-1, 11, 1.5])
      expect(
        masterDeviceResetConfigSchema.safeParse({
          ...defaultMasterDeviceResetConfig,
          requiredApprovals
        }).success
      ).toBe(false)
    for (const waitMinutes of [4, 129601, 5.1])
      expect(
        masterDeviceResetConfigSchema.safeParse({
          ...defaultMasterDeviceResetConfig,
          waitMinutes
        }).success
      ).toBe(false)
    for (const waitMinutes of [5, 129600])
      expect(
        masterDeviceResetConfigSchema.safeParse({
          ...defaultMasterDeviceResetConfig,
          waitMinutes,
          requiredApprovals: 0
        }).success
      ).toBe(true)
    expect(
      masterDeviceResetConfigSchema.safeParse({
        ...defaultMasterDeviceResetConfig,
        notificationEmails: ['invalid']
      }).success
    ).toBe(false)
  })

  it('persists the default onboarding rules', async () => {
    const f = fixtures[11]!
    const id = crypto.randomUUID()
    await new RootResolver().registerNewUser(
      {
        email: `${id}@example.com`,
        deviceId: id,
        deviceName: 'new',
        devicePlatform: 'test',
        firebaseToken: null,
        encryptionSalt: 'salt',
        addDeviceSecret: 'secret',
        addDeviceSecretEncrypted: 'encrypted'
      },
      id,
      f.ctx
    )
    const user = await db.query.user.findFirst({ where: { id } })
    expect(user?.masterDeviceResetConfig).toEqual(
      defaultMasterDeviceResetConfig
    )
    expect(user?.deviceRecoveryCooldownMinutes).toBe(2880)
  })

  it('requires confirmation, a full wait from confirmation, and a distinct other device approval', async () => {
    const f = fixtures[0]!
    const { token, request } = await start(f)
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    expect(
      (
        await processDueResets(
          db,
          new Date(request.processAt.getTime() + 60000)
        )
      ).completedCount
    ).toBe(0)
    const confirmedAt = new Date(request.createdAt.getTime() + 60000)
    expect(await confirmReset(db, token, confirmedAt)).toBe('confirmed')
    const due = new Date(confirmedAt.getTime() + 2880 * 60000)
    expect(
      (await processDueResets(db, new Date(due.getTime() - 1))).completedCount
    ).toBe(0)
    // Token expiry applies to confirmation, not processing after 48 hours.
    expect((await processDueResets(db, due)).completedCount).toBe(1)
    expect((await current(f))?.masterDeviceId).toBeNull()
    expect((await processDueResets(db, due)).completedCount).toBe(0)
    expect(
      await db.query.device.findFirst({ where: { id: f.devices[0]!.id } })
    ).toBeUndefined()
    const completed = email.sentEmails.filter(
      (payload) =>
        payload.Messages[0]?.Subject === 'Master device reset completed'
    )
    expect(
      completed.map((payload) => payload.Messages[0]!.To[0]!.Email)
    ).toEqual([f.user.email, 'backup@example.com'])
  })

  it('does not count repeated approvals toward a quorum of two', async () => {
    const f = fixtures[1]!
    await db
      .update(schema.user)
      .set({
        masterDeviceResetConfig: {
          ...defaultMasterDeviceResetConfig,
          requiredApprovals: 2
        }
      })
      .where(eq(schema.user.id, f.user.id))
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBe(f.devices[0]!.id)
    await actOnReset(
      makeFakeCtx({ userId: f.user.id, device: f.devices[2]! }),
      f.challenge.id,
      'approve'
    )
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBeNull()
  })

  it('allows zero approvals and five-minute recovery', async () => {
    const f = fixtures[2]!
    await updateResetConfig(
      makeFakeCtx({ userId: f.user.id, device: f.devices[0]! }),
      { requiredApprovals: 0, waitMinutes: 5, notificationEmails: [] }
    )
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBeNull()
  })

  it('rejects approvals by the lost master, new devices, and foreign accounts', async () => {
    const f = fixtures[3]!
    await start(f)
    await expect(
      Object.assign(new DecryptionChallengeMutation(), f.challenge).approve(
        f.ctx
      )
    ).rejects.toThrow('explicit master device reset')
    await expect(
      actOnReset(
        makeFakeCtx({ userId: f.user.id, device: f.devices[0]! }),
        f.challenge.id,
        'approve'
      )
    ).rejects.toThrow('another device')
    const [late] = await db
      .insert(schema.device)
      .values({ ...f.devices[1]!, id: crypto.randomUUID() })
      .returning()
    await expect(
      actOnReset(
        makeFakeCtx({ userId: f.user.id, device: late! }),
        f.challenge.id,
        'approve'
      )
    ).rejects.toThrow('another device')
    expect(
      await actOnReset(fixtures[4]!.ctx, f.challenge.id, 'approve')
    ).toBeNull()
    await db
      .update(schema.device)
      .set({ logoutAt: new Date() })
      .where(eq(schema.device.id, f.devices[1]!.id))
    await expect(actOnReset(f.ctx, f.challenge.id, 'approve')).rejects.toThrow(
      'cannot act'
    )
  })

  it('cancels a confirmed request from an existing device and sends notifications', async () => {
    const f = fixtures[4]!
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    await actOnReset(f.ctx, f.challenge.id, 'reject')
    expect(await confirmReset(db, token)).toBe('rejected')
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBe(f.devices[0]!.id)
    expect(
      email.sentEmails.some(
        (payload) =>
          payload.Messages[0]?.Subject === 'Master device reset cancelled'
      )
    ).toBe(true)
  })

  it('keeps the original rules if configuration changes during a reset', async () => {
    const f = fixtures[5]!
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await expect(
      updateResetConfig(f.ctx, {
        requiredApprovals: 0,
        waitMinutes: 5,
        notificationEmails: []
      })
    ).rejects.toThrow('only from the master')
    await updateResetConfig(
      makeFakeCtx({ userId: f.user.id, device: f.devices[0]! }),
      { requiredApprovals: 0, waitMinutes: 5, notificationEmails: [] }
    )
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBe(f.devices[0]!.id)
  })

  it('expires confirmation tokens and allows a fresh request afterwards', async () => {
    const f = fixtures[6]!
    const { token, request } = await start(f)
    expect(await confirmReset(db, 'not-a-real-token')).toBe('not-found')
    expect(await confirmReset(db, token, request.expiresAt)).toBe('expired')
    await db
      .update(schema.masterDeviceResetRequest)
      .set({ expiresAt: new Date(0) })
      .where(eq(schema.masterDeviceResetRequest.id, request.id))
    const restarted = await start(f)
    expect(restarted.token).not.toBe(token)
    expect(await confirmReset(db, restarted.token)).toBe('confirmed')
  })

  it('supports the 90-day maximum without expiring an already confirmed reset', async () => {
    const f = fixtures[7]!
    await updateResetConfig(
      makeFakeCtx({ userId: f.user.id, device: f.devices[0]! }),
      { requiredApprovals: 0, waitMinutes: 129600, notificationEmails: [] }
    )
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBeNull()
  })

  it('rechecks removed approvers and does not reset a subsequently transferred master', async () => {
    const f = fixtures[8]!
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    await db.delete(schema.device).where(eq(schema.device.id, f.devices[1]!.id))
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBe(f.devices[0]!.id)
    await db
      .update(schema.user)
      .set({ masterDeviceId: f.devices[2]!.id })
      .where(eq(schema.user.id, f.user.id))
    await processDueResets(db, request.processAt)
    expect((await current(f))?.masterDeviceId).toBe(f.devices[2]!.id)
  })

  it('deduplicates simultaneous initiation and confirmation', async () => {
    const f = fixtures[9]!
    const results = await Promise.all(
      [1, 2].map(() =>
        initiateReset(
          f.ctx,
          f.user.email!,
          f.challenge.deviceId,
          f.challenge.id
        )
      )
    )
    expect(results.filter((result) => !result.alreadyPending)).toHaveLength(1)
    const [request] = await db
      .select()
      .from(schema.masterDeviceResetRequest)
      .where(eq(schema.masterDeviceResetRequest.userId, f.user.id))
    expect(request).toBeDefined()
  })

  it('retries queued notifications after delivery fails without deleting the master twice', async () => {
    const f = fixtures[10]!
    const { token, request } = await start(f)
    await confirmReset(db, token, request.createdAt)
    await actOnReset(f.ctx, f.challenge.id, 'approve')
    const spy = vi
      .spyOn(email, 'sendEmail')
      .mockRejectedValueOnce(new Error('mail offline'))
    await expect(processDueResets(db, request.processAt)).rejects.toThrow(
      'Some reset emails could not be delivered'
    )
    spy.mockRestore()
    expect((await current(f))?.masterDeviceId).toBeNull()
    await processDueResets(db, request.processAt)
    const completed = email.sentEmails.filter(
      (payload) =>
        payload.Messages[0]?.Subject === 'Master device reset completed' &&
        payload.Messages[0]?.To[0]?.Email === f.user.email
    )
    expect(completed).toHaveLength(1)
  })
})
