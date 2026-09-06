import { RootResolver, getBackendOrigin } from '../schemas/RootResolver'
import { sentEmails } from '../utils/email'
import { readFileSync } from 'node:fs'
import { testDb } from '../tests/testEnv'
import { sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { eq } from 'drizzle-orm'
import type { GraphQLResolveInfo } from 'graphql'
import { db } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { UserMutation } from './UserMutation'
import { EncryptedSecretMutation } from './EncryptedSecret'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { hashDeviceSecret, verifyDeviceSecret } from '../utils/deviceSecretHash'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

// testEnv sets up and closes a fresh PGlite database for this file.
describe('security boundaries', () => {
  const attackerId = crypto.randomUUID()
  const victimId = crypto.randomUUID()
  const deviceId = crypto.randomUUID()
  const victimSecretId = crypto.randomUUID()
  const ownSecretId = crypto.randomUUID()
  const enrollmentSecret = crypto.randomUUID()
  let actor: UserMutation
  let challenge: DecryptionChallengeApproved
  const ctx = makeFakeCtx({ userId: attackerId })
  const patch = {
    encrypted: 'replacement',
    kind: EncryptedSecretTypeGQL.LOGIN_CREDENTIALS
  }

  beforeAll(async () => {
    for (const id of [attackerId, victimId]) {
      await db.insert(schema.user).values({
        id,
        email: `${id}@test.com`,
        addDeviceSecret: await hashDeviceSecret(enrollmentSecret),
        addDeviceSecretEncrypted: 'encrypted-enrollment-secret',
        encryptionSalt: 'salt',
        loginCredentialsLimit: 50,
        TOTPlimit: 10,
        deviceRecoveryCooldownMinutes: 960
      })
    }
    const [device] = await db
      .insert(schema.device)
      .values({
        id: deviceId,
        userId: attackerId,
        name: 'master',
        platform: 'test',
        firstIpAddress: '127.0.0.1',
        lastIpAddress: '127.0.0.1',
        ...defaultDeviceSettingSystemValues
      })
      .returning()
    ctx.device = device
    ctx.jwtPayload.deviceId = deviceId
    const [user] = await db
      .update(schema.user)
      .set({ masterDeviceId: deviceId })
      .where(eq(schema.user.id, attackerId))
      .returning()
    actor = plainToInstance(UserMutation, user)
    await db.insert(schema.encryptedSecret).values([
      {
        id: victimSecretId,
        userId: victimId,
        encrypted: 'victim-ciphertext',
        kind: 'LOGIN_CREDENTIALS',
        version: 1
      },
      {
        id: ownSecretId,
        userId: attackerId,
        encrypted: 'own-ciphertext',
        kind: 'LOGIN_CREDENTIALS',
        version: 1
      }
    ])
    const [row] = await db
      .insert(schema.decryptionChallenge)
      .values({
        userId: attackerId,
        deviceId,
        deviceName: 'master',
        ipAddress: '127.0.0.1',
        approvedAt: new Date()
      })
      .returning()
    challenge = plainToInstance(DecryptionChallengeApproved, row)
  })

  it('builds reset confirmation links from configuration despite hostile headers', async () => {
    vi.stubEnv('BACKEND_URL', 'https://trusted-api.example.com')
    ctx.request.headers = {
      host: 'evil-attacker.test',
      'x-forwarded-proto': 'http',
      'x-forwarded-host': 'evil-attacker.test'
    }
    await new RootResolver().initiateMasterDeviceReset(
      `${attackerId}@test.com`,
      { id: deviceId, name: 'master', platform: 'test' },
      challenge.id,
      ctx
    )
    const message = sentEmails.at(-1)?.Messages[0]
    expect(message?.TextPart).toContain(
      'https://trusted-api.example.com/confirm-master-device-reset?token='
    )
    expect(message?.HTMLPart).not.toContain('evil-attacker.test')
    vi.unstubAllEnvs()
  })

  it('rejects unsafe configured reset origins', () => {
    vi.stubEnv('BACKEND_URL', 'http://evil-attacker.test')
    expect(() => getBackendOrigin()).toThrow('BACKEND_URL')
    vi.unstubAllEnvs()
  })

  it('migrates existing plaintext secrets to compatible verifiers', async () => {
    const migration = readFileSync(
      new URL(
        '../drizzle/migrations/20260906225610_dashing_mulholland_black/migration.sql',
        import.meta.url
      ),
      'utf8'
    )
    await testDb.transaction(async (tx) => {
      await tx.execute(
        sql.raw('CREATE TEMP TABLE "User" ("addDeviceSecret" text)')
      )
      await tx.execute(
        sql`INSERT INTO "User" ("addDeviceSecret") VALUES (${enrollmentSecret})`
      )
      for (const statement of migration.split('--> statement-breakpoint')) {
        await tx.execute(sql.raw(statement))
      }
      const rows = await tx.execute<{ addDeviceSecretHash: string }>(
        sql.raw('SELECT "addDeviceSecretHash" FROM "User"')
      )
      expect(
        await verifyDeviceSecret(
          enrollmentSecret,
          rows.rows[0]!.addDeviceSecretHash
        )
      ).toBe(true)
      expect(rows.rows[0]!.addDeviceSecretHash).not.toBe(enrollmentSecret)
      await tx.execute(sql.raw('DROP TABLE pg_temp."User"'))
    })
  })

  it('does not return foreign ciphertext', async () => {
    expect(
      await actor.encryptedSecret(victimSecretId, ctx, {} as GraphQLResolveInfo)
    ).toBeUndefined()
    expect(
      await actor.encryptedSecret(ownSecretId, ctx, {} as GraphQLResolveInfo)
    ).toMatchObject({ id: ownSecretId })
  })

  it('scopes nested update and delete even with a forged resolver parent', async () => {
    const foreign = plainToInstance(EncryptedSecretMutation, {
      id: victimSecretId,
      version: 1
    })
    await expect(foreign.update(ctx, patch)).rejects.toThrow('Secret not found')
    await expect(foreign.delete(ctx)).rejects.toThrow('Secret not found')
    expect(
      await db.query.encryptedSecret.findFirst({
        where: { id: victimSecretId }
      })
    ).toMatchObject({
      encrypted: 'victim-ciphertext',
      version: 1,
      deletedAt: null
    })
  })

  it('bulk deletion returns and changes only caller-owned rows', async () => {
    const rows = await actor.removeEncryptedSecrets(
      [ownSecretId, victimSecretId],
      ctx
    )
    expect(rows.map((row) => row.id)).toEqual([ownSecretId])
    expect(
      await db.query.encryptedSecret.findFirst({
        where: { id: victimSecretId }
      })
    ).toMatchObject({ deletedAt: null })
  })

  it('rejects foreign secret usage events', async () => {
    await expect(
      actor.createSecretUsageEvent(
        {
          secretId: victimSecretId,
          url: 'https://example.com',
          kind: 'AUTOFILL'
        },
        ctx
      )
    ).rejects.toThrow('Secret not found')
  })

  it('rejects mixed-owner password rotation without changing either user or secrets', async () => {
    const before = await db.query.user.findFirst({ where: { id: attackerId } })
    await expect(
      actor.changeMasterPassword(
        {
          secrets: [
            { id: ownSecretId, ...patch },
            { id: victimSecretId, ...patch }
          ],
          addDeviceSecret: 'new-key',
          addDeviceSecretEncrypted: 'new-ciphertext',
          decryptionChallengeId: challenge.id
        },
        ctx
      )
    ).rejects.toThrow('Secret not found')
    expect(
      await db.query.user.findFirst({ where: { id: attackerId } })
    ).toEqual(before)
    expect(
      await db.query.encryptedSecret.findFirst({ where: { id: ownSecretId } })
    ).toMatchObject({ encrypted: 'own-ciphertext' })
    expect(
      await db.query.encryptedSecret.findFirst({
        where: { id: victimSecretId }
      })
    ).toMatchObject({ encrypted: 'victim-ciphertext' })
  })

  it('requires a challenge belonging to the caller device for password rotation', async () => {
    await expect(
      actor.changeMasterPassword(
        {
          secrets: [],
          addDeviceSecret: 'new-key',
          addDeviceSecretEncrypted: 'new-ciphertext',
          decryptionChallengeId: 2147483647
        },
        ctx
      )
    ).rejects.toThrow('Invalid password change challenge')
  })

  it.each([
    { approvedAt: null, rejectedAt: null, blockIp: false },
    { approvedAt: new Date(), rejectedAt: new Date(), blockIp: false },
    { approvedAt: new Date(), rejectedAt: null, blockIp: true }
  ])('rechecks persisted approval before enrollment: %j', async (state) => {
    await db
      .update(schema.decryptionChallenge)
      .set(state)
      .where(eq(schema.decryptionChallenge.id, challenge.id))
    await expect(
      challenge.addNewDeviceForUser(
        {
          addDeviceSecret: 'rotated',
          addDeviceSecretEncrypted: 'rotated-ciphertext',
          devicePlatform: 'test',
          firebaseToken: null,
          encryptionSalt: 'salt'
        },
        enrollmentSecret,
        ctx
      )
    ).rejects.toThrow('Login failed')
    const unchangedUser = await db.query.user.findFirst({
      where: { id: attackerId }
    })
    expect(
      await verifyDeviceSecret(enrollmentSecret, unchangedUser!.addDeviceSecret)
    ).toBe(true)
  })

  it('binds approval to both user and device', async () => {
    await db
      .update(schema.decryptionChallenge)
      .set({ approvedAt: new Date(), rejectedAt: null, blockIp: false })
      .where(eq(schema.decryptionChallenge.id, challenge.id))
    const forged = plainToInstance(DecryptionChallengeApproved, {
      ...challenge,
      deviceId: crypto.randomUUID()
    })
    await expect(
      forged.addNewDeviceForUser(
        {
          addDeviceSecret: 'rotated',
          addDeviceSecretEncrypted: 'rotated-ciphertext',
          devicePlatform: 'test',
          firebaseToken: null,
          encryptionSalt: 'salt'
        },
        enrollmentSecret,
        ctx
      )
    ).rejects.toThrow('Login failed')
  })

  it('does not accept a stolen database verifier as the enrollment secret', async () => {
    const verifier = await hashDeviceSecret(enrollmentSecret)
    expect(await verifyDeviceSecret(enrollmentSecret, verifier)).toBe(true)
    expect(await verifyDeviceSecret(verifier, verifier)).toBe(false)
    await expect(
      challenge.addNewDeviceForUser(
        {
          addDeviceSecret: 'rotated',
          addDeviceSecretEncrypted: 'rotated-ciphertext',
          devicePlatform: 'test',
          firebaseToken: null,
          encryptionSalt: 'salt'
        },
        verifier,
        ctx
      )
    ).rejects.toThrow('Wrong master password used')
  })

  it('enrolls approved devices and invalidates the old enrollment secret', async () => {
    const input = {
      addDeviceSecret: crypto.randomUUID(),
      addDeviceSecretEncrypted: 'rotated-ciphertext',
      devicePlatform: 'test',
      firebaseToken: null,
      encryptionSalt: 'salt'
    }
    await challenge.addNewDeviceForUser(input, enrollmentSecret, ctx)
    const updatedUser = await db.query.user.findFirst({
      where: { id: attackerId }
    })
    expect(updatedUser?.addDeviceSecret).toMatch(/^pbkdf2-sha256:/)
    expect(
      await verifyDeviceSecret(
        input.addDeviceSecret,
        updatedUser!.addDeviceSecret
      )
    ).toBe(true)
    await expect(
      challenge.addNewDeviceForUser(input, enrollmentSecret, ctx)
    ).rejects.toThrow('Wrong master password used')
  })
  it('allows owner-only master-password rotation and stores a fresh verifier', async () => {
    const nextSecret = crypto.randomUUID()
    expect(
      await actor.changeMasterPassword(
        {
          secrets: [{ id: ownSecretId, ...patch }],
          addDeviceSecret: nextSecret,
          addDeviceSecretEncrypted: 'new-ciphertext',
          decryptionChallengeId: challenge.id
        },
        ctx
      )
    ).toBe(1)
    const updated = await db.query.user.findFirst({ where: { id: attackerId } })
    expect(updated?.tokenVersion).toBe(1)
    expect(await verifyDeviceSecret(nextSecret, updated!.addDeviceSecret)).toBe(
      true
    )
    expect(
      await verifyDeviceSecret('wrong-secret', updated!.addDeviceSecret)
    ).toBe(false)
    expect(
      await db.query.encryptedSecret.findFirst({ where: { id: ownSecretId } })
    ).toMatchObject({ encrypted: 'replacement' })
    expect(
      await db.query.encryptedSecret.findFirst({
        where: { id: victimSecretId }
      })
    ).toMatchObject({ encrypted: 'victim-ciphertext' })
  })
})
