import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createQueuedSecret } from './createQueuedSecret'
import { ensureAccessToken } from '@src/apollo/tokenRefresh'
import { getAccessToken } from '@src/util/accessTokenExtension'
import type { PendingSecret } from './pendingSecrets'
import { isCurrentStoredVaultKey } from './pendingSecrets'

vi.mock('@src/apollo/API_URL', () => ({
  API_URL: 'https://api.authier.test/graphql'
}))
vi.mock('@src/apollo/tokenRefresh', () => ({ ensureAccessToken: vi.fn() }))
vi.mock('@src/util/accessTokenExtension', () => ({ getAccessToken: vi.fn() }))
vi.mock('./pendingSecrets', () => ({ isCurrentStoredVaultKey: vi.fn() }))

const entry: PendingSecret = {
  userId: 'account',
  keyId: 'local-key-fingerprint',
  createdAt: '2026-10-27T10:00:00.000Z',
  operation: {
    id: '91d21f22-1e8a-4863-908f-522d957247f1',
    operationId: '5987c80f-0087-4614-b6c4-f5ff0e83ccaa',
    encrypted: 'opaque-ciphertext',
    kind: 'LOGIN_CREDENTIALS'
  }
}
const tokenFor = (userId: string) =>
  `e30.${btoa(JSON.stringify({ userId }))}.test`
const confirmed = {
  ...entry.operation,
  version: 1,
  createdAt: entry.createdAt,
  updatedAt: null,
  deletedAt: null
}
const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(ensureAccessToken).mockResolvedValue(undefined)
  vi.mocked(isCurrentStoredVaultKey).mockResolvedValue(true)
  vi.mocked(getAccessToken).mockResolvedValue(tokenFor(entry.userId))
  fetchMock.mockResolvedValue(Response.json(confirmed))
})
afterEach(() => vi.unstubAllGlobals())

it('uses the idempotent endpoint and sends only the saved operation with account authentication', async () => {
  await expect(createQueuedSecret(entry, () => true)).resolves.toMatchObject({
    id: entry.operation.id,
    version: 1
  })
  expect(ensureAccessToken).toHaveBeenCalledOnce()
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.authier.test/api/v1/vault/create')
  expect(options?.headers).toEqual({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenFor(entry.userId)}`
  })
  expect(JSON.parse(String(options?.body))).toEqual(entry.operation)
  expect(options?.signal).toBeInstanceOf(AbortSignal)
})

it.each([401, 403, 409, 429, 500])(
  'never acknowledges an HTTP %s failure',
  async (status) => {
    fetchMock.mockResolvedValue(
      Response.json({ message: 'private backend details' }, { status })
    )
    await expect(createQueuedSecret(entry, () => true)).rejects.toThrow(
      `synchronization failed (${status})`
    )
  }
)

it('checks account and session again after authentication refresh', async () => {
  vi.mocked(getAccessToken).mockResolvedValue(tokenFor('another-account'))
  await expect(createQueuedSecret(entry, () => true)).rejects.toThrow(
    'another account'
  )
  vi.mocked(getAccessToken).mockResolvedValue(tokenFor(entry.userId))
  let current = true
  vi.mocked(ensureAccessToken).mockImplementation(async () => {
    current = false
  })
  await expect(createQueuedSecret(entry, () => current)).rejects.toThrow(
    'Unlock'
  )
  expect(fetchMock).not.toHaveBeenCalled()
})

it('does not upload from a stale window after the shared session is locked or rotated', async () => {
  vi.mocked(isCurrentStoredVaultKey).mockResolvedValue(false)
  await expect(createQueuedSecret(entry, () => true)).rejects.toThrow('Unlock')
  expect(fetchMock).not.toHaveBeenCalled()
})

it.each([
  { id: crypto.randomUUID() },
  { encrypted: 'different-ciphertext' },
  { kind: 'TOTP' },
  { deletedAt: entry.createdAt }
])(
  'does not drop a pending record after an invalid acknowledgement %j',
  async (patch) => {
    fetchMock.mockResolvedValue(Response.json({ ...confirmed, ...patch }))
    await expect(createQueuedSecret(entry, () => true)).rejects.toThrow(
      'did not confirm'
    )
  }
)
