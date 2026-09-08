import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { and, eq } from 'drizzle-orm'
import { sign } from 'jsonwebtoken'
import { db, setDb } from './prisma/prismaClient'
import { setupTestDb, testDb } from './tests/testEnv'
import * as schema from './drizzle/schema'
import { buildApp } from './app'
import { defaultDeviceSettingSystemValues } from './models/defaultDeviceSettingSystemValues'
import { generateOpenApiDocument } from './orpc/openapi'
import {
  mobileSecretRecordSchema,
  vaultSyncResultSchema
} from '@shared/orpc/schemas'
import type { VaultApiInputs } from '@shared/orpc/contract'
import { runVaultTransaction } from './vault/vaultWrites'
import { getEncryptedSecretsToSync } from './models/Device'

let client: PGlite
const app = buildApp()
const userId = crypto.randomUUID()
const deviceId = crypto.randomUUID()
const otherUserId = crypto.randomUUID()
const passkeyUserId = crypto.randomUUID()
const passkeyDeviceId = crypto.randomUUID()
const accessToken = sign(
  { userId, deviceId, tokenVersion: 0 },
  process.env.ACCESS_TOKEN_SECRET!
)

beforeAll(async () => {
  client = await setupTestDb()
  setDb(testDb)
  await db.insert(schema.user).values(
    [userId, otherUserId, passkeyUserId].map((id) => ({
      id,
      email: `${id}@test.com`,
      loginCredentialsLimit: 100,
      TOTPlimit: 100,
      deviceRecoveryCooldownMinutes: 960,
      addDeviceSecret: 'hash',
      addDeviceSecretEncrypted: 'encrypted',
      encryptionSalt: 'salt'
    }))
  )
  await db.insert(schema.device).values({
    id: deviceId,
    userId,
    name: 'Android',
    platform: 'android',
    firstIpAddress: '127.0.0.1',
    lastIpAddress: '127.0.0.1',
    ...defaultDeviceSettingSystemValues
  })
  await db.insert(schema.device).values({
    id: passkeyDeviceId,
    userId: passkeyUserId,
    name: 'Passkey client',
    platform: 'test',
    firstIpAddress: '127.0.0.1',
    lastIpAddress: '127.0.0.1',
    ...defaultDeviceSettingSystemValues,
    syncTOTP: false
  })
})

afterAll(async () => {
  await client.close()
})

const request = (
  route: string,
  input: unknown,
  token: string | null = accessToken
) =>
  app.handle(
    new Request(`http://authier.test/api/v1/${route}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(input)
    })
  )
const createInput = (): VaultApiInputs['mobile']['create'] => ({
  operationId: crypto.randomUUID(),
  id: crypto.randomUUID(),
  kind: 'LOGIN_CREDENTIALS',
  encrypted: 'ciphertext'
})
const create = async (input = createInput()) => {
  const response = await request('vault/create', input)
  expect(response.status).toBe(200)
  return mobileSecretRecordSchema.parse(await response.json())
}
const sync = async (input: VaultApiInputs['mobile']['sync'] = {}) => {
  const response = await request('vault/sync', input)
  expect(response.status).toBe(200)
  return vaultSyncResultSchema.parse(await response.json())
}

describe('versioned JSON mobile API', () => {
  it('syncs versioned passkeys without TOTP and shares the password quota across creates and kind changes', async () => {
    const token = sign(
      { userId: passkeyUserId, deviceId: passkeyDeviceId, tokenVersion: 0 },
      process.env.ACCESS_TOKEN_SECRET!
    )
    const call = (route: string, input: unknown) => request(route, input, token)
    const write = async (route: string, input: unknown) => {
      const response = await call(route, input)
      expect(response.status).toBe(200)
      return mobileSecretRecordSchema.parse(await response.json())
    }
    await db
      .update(schema.user)
      .set({ loginCredentialsLimit: 2 })
      .where(eq(schema.user.id, passkeyUserId))
    await write('vault/create', createInput())
    const passkeyInput = {
      ...createInput(),
      kind: 'PASSKEY',
      encrypted: 'opaque-passkey'
    }
    const passkey = await write('vault/create', passkeyInput)
    expect(await write('vault/create', passkeyInput)).toEqual(passkey)
    for (const kind of ['LOGIN_CREDENTIALS', 'PASSKEY']) {
      expect(
        (await call('vault/create', { ...createInput(), kind })).status
      ).toBe(400)
    }
    const totp = await write('vault/create', { ...createInput(), kind: 'TOTP' })
    const updated = await write('vault/update', {
      ...passkeyInput,
      operationId: crypto.randomUUID(),
      expectedVersion: 1,
      encrypted: 'updated-passkey'
    })
    expect(updated).toMatchObject({ kind: 'PASSKEY', version: 2 })
    const deleted = await write('vault/delete', {
      operationId: crypto.randomUUID(),
      id: passkey.id,
      expectedVersion: 2
    })
    expect(deleted).toMatchObject({ kind: 'PASSKEY', version: 3 })
    expect(deleted.deletedAt).not.toBeNull()
    // A tombstone frees quota; converting a TOTP into a credential must check
    // the same combined quota and roll back the failed version/log update.
    await write('vault/create', createInput())
    expect(
      (
        await call('vault/update', {
          ...createInput(),
          id: totp.id,
          kind: 'PASSKEY',
          expectedVersion: 1
        })
      ).status
    ).toBe(400)

    const changes: Array<{
      secret: ReturnType<typeof mobileSecretRecordSchema.parse>
    }> = []
    let cursor: string | undefined
    let hasMore = true
    while (hasMore) {
      const page = vaultSyncResultSchema.parse(
        await (await call('vault/sync', { cursor, limit: 1 })).json()
      )
      changes.push(...page.changes)
      cursor = page.nextCursor
      hasMore = page.hasMore
    }
    expect(
      changes
        .filter(({ secret }) => secret.id === passkey.id)
        .map(({ secret }) => secret)
    ).toEqual([passkey, updated, deleted])
    expect(changes.filter(({ secret }) => secret.id === totp.id)).toHaveLength(
      1
    )
    expect(
      changes.find(({ secret }) => secret.id === totp.id)?.secret
    ).toMatchObject({
      kind: 'TOTP',
      encrypted: '',
      version: 1,
      deletedAt: expect.any(String)
    })
  })

  it('publishes the same OpenAPI document with named schemas and a challenge discriminator', async () => {
    const response = await app.handle(
      new Request('http://authier.test/api/v1/openapi.json')
    )
    expect(response.status).toBe(200)
    const document = await response.json()
    expect(document).toEqual(await generateOpenApiDocument())
    expect(
      document.components.schemas.DeviceChallenge.discriminator.propertyName
    ).toBe('status')
    expect(document.paths['/vault/sync'].post.security).toEqual([
      { bearerAuth: [] }
    ])
  })

  it('authenticates bearer tokens and rejects malformed input, wrong-account and revoked devices', async () => {
    expect((await request('vault/sync', {}, null)).status).toBe(401)
    expect((await request('vault/sync', { limit: 501 })).status).toBe(400)
    const mismatched = sign(
      { userId: otherUserId, deviceId, tokenVersion: 0 },
      process.env.ACCESS_TOKEN_SECRET!
    )
    expect((await request('vault/sync', {}, mismatched)).status).toBe(401)
    await db
      .update(schema.device)
      .set({ deletedAt: new Date() })
      .where(eq(schema.device.id, deviceId))
    expect((await request('vault/sync', {})).status).toBe(401)
    await db
      .update(schema.device)
      .set({ deletedAt: null })
      .where(eq(schema.device.id, deviceId))
  })

  it('stores one result for concurrent create retries and rejects operation-id reuse', async () => {
    const input = createInput()
    const [first, retry] = await Promise.all([create(input), create(input)])
    expect(retry).toEqual(first)
    const changes = await db
      .select()
      .from(schema.vaultChange)
      .where(eq(schema.vaultChange.secretId, input.id))
    expect(changes).toHaveLength(1)
    const conflict = await request('vault/create', {
      ...input,
      encrypted: 'different'
    })
    expect(conflict.status).toBe(409)
    expect(await conflict.json()).toMatchObject({ code: 'CONFLICT' })
  })

  it('returns stable pages and never loses changes written between page fetches', async () => {
    const start = await sync()
    const first = await create()
    const second = await create()
    const page = await sync({ cursor: start.nextCursor, limit: 1 })
    expect(page.changes.map((entry) => entry.secret.id)).toEqual([first.id])
    expect(page.hasMore).toBe(true)
    const update = {
      ...createInput(),
      id: first.id,
      expectedVersion: first.version,
      encrypted: 'changed-during-pagination'
    }
    expect((await request('vault/update', update)).status).toBe(200)
    const next = await sync({ cursor: page.nextCursor, limit: 1 })
    expect(next.changes[0].secret.id).toBe(second.id)
    const last = await sync({ cursor: next.nextCursor, limit: 1 })
    expect(last.changes[0].secret).toMatchObject({
      id: first.id,
      encrypted: 'changed-during-pagination',
      version: 2
    })
    expect(last.hasMore).toBe(false)
    expect((await sync({ cursor: last.nextCursor })).changes).toEqual([])
    expect(
      (await sync({ cursor: start.nextCursor, limit: 1 })).changes
    ).toEqual(page.changes)
  })

  it('rejects stale concurrent updates and retries update/delete without writing duplicate versions', async () => {
    const secret = await create()
    const update = {
      ...createInput(),
      id: secret.id,
      expectedVersion: secret.version,
      encrypted: 'edited'
    }
    const responses = await Promise.all([
      request('vault/update', update),
      request('vault/update', {
        ...update,
        operationId: crypto.randomUUID(),
        encrypted: 'competing-edit'
      })
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409
    ])
    const winnerIndex = responses.findIndex(
      (response) => response.status === 200
    )
    const winner = mobileSecretRecordSchema.parse(
      await responses[winnerIndex].json()
    )
    expect(winner.version).toBe(2)
    const retryInput = winnerIndex === 0 ? update : null
    if (retryInput)
      expect(
        mobileSecretRecordSchema.parse(
          await (await request('vault/update', retryInput)).json()
        )
      ).toEqual(winner)
    const deletion = {
      operationId: crypto.randomUUID(),
      id: secret.id,
      expectedVersion: winner.version
    }
    const deleted = mobileSecretRecordSchema.parse(
      await (await request('vault/delete', deletion)).json()
    )
    expect(deleted.version).toBe(3)
    expect(deleted.deletedAt).not.toBeNull()
    expect(
      mobileSecretRecordSchema.parse(
        await (await request('vault/delete', deletion)).json()
      )
    ).toEqual(deleted)
    expect(
      (
        await request('vault/update', {
          ...update,
          operationId: crypto.randomUUID(),
          expectedVersion: deleted.version
        })
      ).status
    ).toBe(409)
  })

  it('tracks GraphQL create, update, delete and batch removal through the shared API service', async () => {
    const start = await sync()
    const graphql = async (
      query: string,
      variables: Record<string, unknown> = {}
    ) => {
      const response = await app.handle(
        new Request('http://authier.test/graphql', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
            'x-forwarded-for': '127.0.0.1'
          },
          body: JSON.stringify({ query, variables })
        })
      )
      const result = await response.json()
      expect(result.errors).toBeUndefined()
      return result.data
    }
    const added = await graphql(
      'mutation { me { addEncryptedSecrets(secrets: [{encrypted: "legacy", kind: TOTP}, {encrypted: "legacy-batch", kind: TOTP}]) { id } } }'
    )
    const [first, second] = added.me.addEncryptedSecrets
    await graphql(
      'mutation($id: ID!) { me { encryptedSecret(id: $id) { update(patch: {encrypted: "legacy-update", kind: TOTP}) { id } } } }',
      { id: first.id }
    )
    await graphql(
      'mutation($id: ID!) { me { encryptedSecret(id: $id) { delete { id } } } }',
      { id: first.id }
    )
    await graphql(
      'mutation($ids: [UUID!]!) { me { removeEncryptedSecrets(secrets: $ids) { id } } }',
      { ids: [second.id] }
    )
    const changes = (await sync({ cursor: start.nextCursor })).changes
    expect(changes.map((entry) => entry.secret.version)).toEqual([
      1, 1, 2, 3, 2
    ])
    expect(changes[3].secret.deletedAt).not.toBeNull()
    expect(changes[4].secret.deletedAt).not.toBeNull()
  })

  it('rolls back the cursor, operation reservation and item when quota validation fails', async () => {
    await db
      .update(schema.user)
      .set({ TOTPlimit: 0 })
      .where(eq(schema.user.id, userId))
    const start = await sync()
    const input = { ...createInput(), kind: 'TOTP' }
    expect((await request('vault/create', input)).status).toBe(400)
    expect((await sync({ cursor: start.nextCursor })).changes).toEqual([])
    expect(
      await db
        .select()
        .from(schema.vaultOperation)
        .where(eq(schema.vaultOperation.operationId, input.operationId))
    ).toEqual([])
    await db
      .update(schema.user)
      .set({ TOTPlimit: 100 })
      .where(eq(schema.user.id, userId))
    expect((await request('vault/create', input)).status).toBe(200)
  })

  it('redacts TOTP and invalidates cursors when policy or account changes', async () => {
    const start = await sync()
    await db
      .update(schema.device)
      .set({ syncTOTP: false })
      .where(eq(schema.device.id, deviceId))
    const invalid = await request('vault/sync', { cursor: start.nextCursor })
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({ code: 'CURSOR_INVALID' })
    const page = await sync()
    const totp = page.changes.filter((entry) => entry.secret.kind === 'TOTP')
    expect(totp.length).toBeGreaterThan(0)
    expect(
      totp.every(
        (entry) =>
          entry.secret.encrypted === '' && entry.secret.deletedAt !== null
      )
    ).toBe(true)
    await db
      .update(schema.device)
      .set({ syncTOTP: true })
      .where(eq(schema.device.id, deviceId))
    expect(
      (
        await request('vault/sync', {
          cursor: start.nextCursor.replace(userId, otherUserId)
        })
      ).status
    ).toBe(400)
  })

  it('does not expose other accounts secrets or let writes target them', async () => {
    const id = crypto.randomUUID()
    await runVaultTransaction(db, otherUserId, (writer) =>
      writer.create([
        { id, encrypted: 'other-account', kind: 'LOGIN_CREDENTIALS' }
      ])
    )
    expect(
      (await sync()).changes.every((entry) => entry.secret.id !== id)
    ).toBe(true)
    expect(
      (
        await request('vault/delete', {
          id,
          expectedVersion: 1,
          operationId: crypto.randomUUID()
        })
      ).status
    ).toBe(404)
  })

  it('legacy sync still includes a change even after a later acknowledgement timestamp', async () => {
    const secret = await create()
    const [currentDevice] = await db
      .select()
      .from(schema.device)
      .where(eq(schema.device.id, deviceId))
    const records = await getEncryptedSecretsToSync(
      {
        db,
        device: currentDevice,
        jwtPayload: { userId, deviceId, tokenVersion: 0 }
      },
      { userId, lastSyncAt: new Date(Date.now() + 60000) }
    )
    expect(records.some((record) => record.id === secret.id)).toBe(true)
  })

  it('rejects incomplete or stale rotation snapshots, then rotates the complete current vault atomically', async () => {
    await create()
    const staleActor = { userId, deviceId, tokenVersion: 0 }
    await db
      .update(schema.user)
      .set({ masterDeviceId: deviceId })
      .where(eq(schema.user.id, userId))
    const [challenge] = await db
      .insert(schema.decryptionChallenge)
      .values({
        userId,
        deviceId,
        deviceName: 'Android',
        ipAddress: '127.0.0.1',
        approvedAt: new Date()
      })
      .returning()
    const snapshot = () =>
      db.query.encryptedSecret.findMany({
        where: { userId, deletedAt: { isNull: true } }
      })
    const prepare = (records: Awaited<ReturnType<typeof snapshot>>) =>
      records.map((record) => ({
        id: record.id,
        expectedVersion: record.version,
        encrypted: 'encrypted-with-new-master-key',
        kind: record.kind
      }))
    const rotate = async (
      secrets: Array<{
        id: string
        expectedVersion?: number
        encrypted: string
        kind: string
      }>
    ) => {
      const response = await app.handle(
        new Request('http://authier.test/graphql', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
            'x-forwarded-for': '127.0.0.1'
          },
          body: JSON.stringify({
            query:
              'mutation($input: ChangeMasterPasswordInput!) { me { changeMasterPassword(input: $input) } }',
            variables: {
              input: {
                decryptionChallengeId: challenge.id,
                secrets,
                addDeviceSecret: 'rotated-device-secret',
                addDeviceSecretEncrypted: 'encrypted-rotated-secret'
              }
            }
          })
        })
      )
      return response.json()
    }
    const oldSnapshot = await snapshot()
    // Another device creates an item after the client has decrypted its snapshot.
    const added = await create()
    expect((await rotate(prepare(oldSnapshot))).errors[0].message).toContain(
      'complete vault'
    )
    const beforeEdit = await snapshot()
    const updatedResponse = await request('vault/update', {
      ...createInput(),
      id: added.id,
      expectedVersion: added.version,
      encrypted: 'concurrent-edit'
    })
    expect(updatedResponse.status).toBe(200)
    expect((await rotate(prepare(beforeEdit))).errors[0].message).toContain(
      'Vault changed'
    )
    const complete = await snapshot()
    const missingVersions = prepare(complete).map(
      ({ expectedVersion, ...record }) => record
    )
    expect((await rotate(missingVersions)).errors[0].message).toContain(
      'Update your Authier app'
    )
    expect(
      (await db.query.user.findFirst({ where: { id: userId } }))?.tokenVersion
    ).toBe(0)
    expect(
      (await db.query.encryptedSecret.findFirst({ where: { id: added.id } }))
        ?.encrypted
    ).toBe('concurrent-edit')

    const start = await sync()
    const result = await rotate(prepare(complete))
    expect(result.errors).toBeUndefined()
    expect(result.data.me.changeMasterPassword).toBe(complete.length)
    expect((await request('vault/sync', {})).status).toBe(401)
    const rotatedToken = sign(
      { userId, deviceId, tokenVersion: 1 },
      process.env.ACCESS_TOKEN_SECRET!
    )
    const page = vaultSyncResultSchema.parse(
      await (
        await request('vault/sync', { cursor: start.nextCursor }, rotatedToken)
      ).json()
    )
    expect(page.changes).toHaveLength(complete.length)
    for (const record of complete)
      expect(page.changes.map((entry) => entry.secret)).toContainEqual(
        expect.objectContaining({
          id: record.id,
          version: record.version + 1,
          encrypted: 'encrypted-with-new-master-key'
        })
      )

    // This actor authenticated before rotation; the shared writer must still
    // reject it after acquiring the account lock, before creating old-key data.
    await expect(
      runVaultTransaction(db, staleActor, (writer) =>
        writer.create([
          {
            id: crypto.randomUUID(),
            kind: 'LOGIN_CREDENTIALS',
            encrypted: 'old-key-ciphertext'
          }
        ])
      )
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('revalidates a queued writer generation after the prior transaction commits', async () => {
    const actor = { userId, deviceId, tokenVersion: 1 }
    const entered = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    const rotating = runVaultTransaction(db, actor, async (_writer, tx) => {
      await tx
        .update(schema.user)
        .set({ tokenVersion: 2 })
        .where(eq(schema.user.id, userId))
      entered.resolve()
      await release.promise
    })
    await entered.promise
    let attemptedWrite = false
    const queued = runVaultTransaction(db, actor, async (writer) => {
      attemptedWrite = true
      return writer.create([
        {
          id: crypto.randomUUID(),
          encrypted: 'stale-key-write',
          kind: 'LOGIN_CREDENTIALS'
        }
      ])
    })
    const rejected = expect(queued).rejects.toMatchObject({
      code: 'UNAUTHORIZED'
    })
    release.resolve()
    await rotating
    await rejected
    expect(attemptedWrite).toBe(false)
  })
})
