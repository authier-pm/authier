import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import browser from 'webextension-polyfill'
import {
  abToCryptoKey,
  bufferToBase64,
  cryptoKeyToString
} from '@shared/cryptoUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { DeviceState, device, deviceInitialization } from './ExtensionDevice'
import type { IBackgroundStateSerializable } from './backgroundPage'
import {
  readPendingSecrets,
  enqueueSecrets,
  pendingSecretRecord,
  pendingSecretKeyId
} from './pendingSecrets'
import { createQueuedSecret } from './createQueuedSecret'
import { readLockedVaultSnapshot } from './lockedVaultStorage'
import {
  mockPersistentVaultStorage,
  mockVaultLocks
} from '../../tests/vaultStorage'

vi.unmock('@src/background/ExtensionDevice')
vi.mock('./createQueuedSecret', () => ({ createQueuedSecret: vi.fn() }))
vi.mock('@src/apollo/apolloClient', () => ({
  apolloClient: { mutate: vi.fn(), query: vi.fn() }
}))
vi.mock('@src/ExtensionProviders', () => ({ toast: vi.fn() }))

let snapshot: IBackgroundStateSerializable
let storage: ReturnType<typeof mockPersistentVaultStorage>
const input = [
  {
    kind: EncryptedSecretType.LOGIN_CREDENTIALS,
    createdAt: '2026-10-27T10:00:00.000Z',
    encrypted: '',
    loginCredentials: {
      label: 'One-time secret',
      username: 'alice',
      password: 'never-lose-this-value',
      url: 'https://example.com',
      iconUrl: null
    }
  }
]

beforeAll(async () => {
  await deviceInitialization
  vi.stubGlobal('crypto', webcrypto)
  snapshot = {
    userId: 'owner',
    email: 'alice@example.com',
    deviceName: 'test',
    encryptionSalt: bufferToBase64(new Uint8Array(16)),
    masterEncryptionKey: await cryptoKeyToString(
      await abToCryptoKey(new Uint8Array(32).fill(1))
    ),
    authSecret: 'private-enrollment',
    authSecretEncrypted: 'encrypted-enrollment',
    secrets: [],
    vaultLockTimeoutSeconds: 0,
    syncTOTP: true,
    autofillCredentialsEnabled: true,
    autofillTOTPEnabled: true,
    autofillForbiddenUrlPatterns: '',
    uiLanguage: 'en',
    theme: 'dark',
    notificationOnVaultUnlock: false,
    notificationOnWrongPasswordAttempts: 3
  }
})
beforeEach(async () => {
  vi.clearAllMocks()
  storage = mockPersistentVaultStorage()
  mockVaultLocks()
  vi.mocked(createQueuedSecret).mockRejectedValue(new Error('offline'))
  await device.save(structuredClone(snapshot))
})
afterEach(() => {
  device.state?.destroy()
  device.state = null
})

it('acknowledges a durable encrypted local save while offline, then restores after browser restart', async () => {
  const [saved] = await device.state!.addSecrets(input)
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow('offline')
  const [entry] = await readPendingSecrets(snapshot.userId)
  expect(entry.operation.id).toBe(saved.id)
  expect(entry.operation.operationId).not.toBe(saved.id)
  expect(JSON.stringify(storage.local)).not.toContain('never-lose-this-value')
  expect(JSON.stringify(storage.local)).not.toContain(
    snapshot.masterEncryptionKey
  )
  expect(JSON.stringify(storage.local)).not.toContain('private-enrollment')
  const locked = await readLockedVaultSnapshot()
  expect(locked?.secrets).toHaveLength(1)
  device.state!.destroy()
  await browser.storage.session.clear()
  // Even a stale snapshot cannot erase a newer durable save.
  await device.save({ ...snapshot, secrets: [] })
  const restored = device.state!.decryptedSecrets[0]
  expect(restored.kind).toBe(EncryptedSecretType.LOGIN_CREDENTIALS)
  if (restored.kind !== EncryptedSecretType.LOGIN_CREDENTIALS)
    throw new Error('Missing login')
  expect(restored.loginCredentials.password).toBe('never-lose-this-value')
  expect(device.state!.pendingSecretIds).toEqual([saved.id])
})

it('does not report success or send anything when durable storage rejects the save', async () => {
  vi.mocked(browser.storage.local.set).mockRejectedValueOnce(
    new Error('storage full')
  )
  await expect(device.state!.addSecrets(input)).rejects.toThrow('storage full')
  expect(createQueuedSecret).not.toHaveBeenCalled()
  expect(await readPendingSecrets(snapshot.userId)).toEqual([])
  expect(device.state!.secrets).toEqual([])
})

it('rejects a stale window after another window locks the shared session', async () => {
  await browser.storage.session.set({ backgroundState: null })
  await expect(device.state!.addSecrets(input)).rejects.toThrow('Unlock')
  expect(await readPendingSecrets(snapshot.userId)).toEqual([])
  expect(createQueuedSecret).not.toHaveBeenCalled()
})

it('retries an ambiguous server commit with identical IDs and ciphertext and removes only acknowledged entries', async () => {
  await device.state!.addSecrets(input)
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow('offline')
  const [entry] = await readPendingSecrets(snapshot.userId)
  vi.mocked(createQueuedSecret).mockImplementation(async (write) => ({
    ...pendingSecretRecord(write),
    version: 1,
    updatedAt: null,
    deletedAt: null
  }))
  await Promise.all([
    device.state!.flushPendingSecrets(),
    device.state!.flushPendingSecrets()
  ])
  expect(await readPendingSecrets(snapshot.userId)).toEqual([])
  expect(device.state!.secrets).toEqual([
    { ...pendingSecretRecord(entry), version: 1 }
  ])
  for (const [write] of vi.mocked(createQueuedSecret).mock.calls)
    expect(write).toEqual(entry)
  expect(device.state!.pendingSecretIds).toEqual([])
})

it('retains ciphertext after logout, isolates accounts and refuses an earlier vault key', async () => {
  await device.state!.addSecrets(input)
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow('offline')
  await device.clearLocalStorage()
  expect(await readPendingSecrets(snapshot.userId)).toHaveLength(1)
  await device.save({ ...snapshot, userId: 'another-user' })
  expect(device.state!.decryptedSecrets).toEqual([])
  await device.save({
    ...snapshot,
    masterEncryptionKey: await cryptoKeyToString(
      await abToCryptoKey(new Uint8Array(32).fill(2))
    ),
    authSecretEncrypted: 'new-enrollment-after-rotation'
  })
  vi.mocked(createQueuedSecret).mockClear()
  await device.state!.flushPendingSecrets()
  expect(createQueuedSecret).not.toHaveBeenCalled()
  expect(device.state!.previousKeyPendingSecretsCount).toBe(1)
  expect(await readPendingSecrets(snapshot.userId)).toHaveLength(1)
})

it('cannot delete or rotate an unsynchronized item', async () => {
  const [saved] = await device.state!.addSecrets(input)
  await expect(device.state!.requireSyncedSecrets([saved.id])).rejects.toThrow(
    'Synchronize'
  )
  await expect(device.state!.removeSecret(saved.id)).rejects.toThrow(
    'Synchronize'
  )
  await expect(
    device.serializeSecrets(
      device.state!.secrets,
      await abToCryptoKey(new Uint8Array(32))
    )
  ).rejects.toThrow('Synchronize')
})

it('can synchronize after re-login changes the enrollment verifier but retains the same vault key', async () => {
  await device.state!.addSecrets(input)
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow('offline')
  await device.clearLocalStorage()
  await device.save({
    ...snapshot,
    authSecretEncrypted: 'new-enrollment-for-the-same-key'
  })
  expect(device.state!.pendingSecretIds).toHaveLength(1)
  expect(device.state!.previousKeyPendingSecretsCount).toBe(0)
  vi.mocked(createQueuedSecret).mockImplementation(async (entry) => ({
    ...pendingSecretRecord(entry),
    version: 1,
    updatedAt: null,
    deletedAt: null
  }))
  await device.state!.flushPendingSecrets()
  expect(await readPendingSecrets(snapshot.userId)).toEqual([])
})

it('retains the operation when caching a server acknowledgement fails', async () => {
  await device.state!.addSecrets(input)
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow('offline')
  const entries = await readPendingSecrets(snapshot.userId)
  vi.mocked(createQueuedSecret).mockImplementation(async (entry) => ({
    ...pendingSecretRecord(entry),
    version: 1,
    updatedAt: null,
    deletedAt: null
  }))
  vi.mocked(browser.storage.local.set).mockRejectedValueOnce(
    new Error('disk failure')
  )
  await expect(device.state!.flushPendingSecrets()).rejects.toThrow(
    'disk failure'
  )
  expect(await readPendingSecrets(snapshot.userId)).toEqual(entries)
  await device.state!.flushPendingSecrets()
  expect(await readPendingSecrets(snapshot.userId)).toEqual([])
})

it('keeps a late acknowledgement pending after locking and does not resurrect an unlocked session', async () => {
  let finish!: (value: Awaited<ReturnType<typeof createQueuedSecret>>) => void
  vi.mocked(createQueuedSecret).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  await device.state!.addSecrets(input)
  const previous = device.state!
  await vi.waitFor(() => expect(finish).toBeDefined())
  const [entry] = await readPendingSecrets(snapshot.userId)
  await device.lock()
  finish({
    ...pendingSecretRecord(entry),
    version: 1,
    updatedAt: null,
    deletedAt: null
  })
  await previous.flushPendingSecrets()
  expect(device.state).toBeNull()
  expect(previous.masterEncryptionKey).toBe('')
  expect(storage.session.backgroundState).toBeNull()
  expect(await readPendingSecrets(snapshot.userId)).toHaveLength(1)
})

it('preserves unknown kinds and tombstones without decrypting them or exposing them to autofill', async () => {
  const unknown = {
    id: 'future',
    kind: 'FUTURE_SECRET',
    encrypted: 'opaque-future-format',
    createdAt: input[0].createdAt,
    version: 2
  }
  const tombstone = {
    ...unknown,
    id: 'deleted',
    kind: EncryptedSecretType.TOTP,
    encrypted: '',
    deletedAt: input[0].createdAt
  }
  await device.save({ ...snapshot, secrets: [unknown, tombstone] })
  await device.state!.addSecrets(input)
  expect(device.state!.unsupportedSecretsCount).toBe(1)
  expect(device.state!.decryptedSecrets).toHaveLength(1)
  expect((await readLockedVaultSnapshot())?.secrets).toEqual(
    expect.arrayContaining([unknown, tombstone])
  )
  expect(await device.state!.getSecretDecryptedById('future')).toBeUndefined()
  expect(await device.state!.getSecretsDecryptedByTLD('other.example')).toEqual(
    []
  )
  const state = new DeviceState(
    { ...snapshot, secrets: [unknown] },
    { listenToStorage: false }
  )
  await state.initialized
  expect(state.secrets).toContainEqual(unknown)
})

it('preserves unsupported queued items without sending them through a known-kind write API', async () => {
  await enqueueSecrets([
    {
      ...snapshot,
      keyId: await pendingSecretKeyId(snapshot.masterEncryptionKey),
      createdAt: input[0].createdAt,
      operation: {
        id: crypto.randomUUID(),
        operationId: crypto.randomUUID(),
        encrypted: 'opaque',
        kind: 'FUTURE_SECRET'
      }
    }
  ])
  await device.state!.save()
  await device.state!.flushPendingSecrets()
  expect(createQueuedSecret).not.toHaveBeenCalled()
  expect(device.state!.unsupportedSecretsCount).toBe(1)
  expect(await readPendingSecrets(snapshot.userId)).toHaveLength(1)
})
