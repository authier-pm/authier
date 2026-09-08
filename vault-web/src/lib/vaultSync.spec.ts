import type { VaultApiInputs, VaultApiOutputs } from '@shared/orpc/contract'
import { describe, expect, it, vi } from 'vitest'
import { collectVaultChanges, mergeVaultChanges } from './vaultSync'

type SyncPage = VaultApiOutputs['mobile']['sync']
type SyncSecret = SyncPage['changes'][number]['secret']
type Secret = VaultApiOutputs['session']['bootstrap']['secrets'][number]

const secret = (overrides: Partial<Secret> = {}): Secret => ({
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'LOGIN_CREDENTIALS',
  encrypted: 'encrypted-payload',
  version: 1,
  createdAt: '2026-09-08T10:00:00.000Z',
  updatedAt: null,
  ...overrides
})

const synced = (overrides: Partial<SyncSecret> = {}): SyncSecret => ({
  ...secret(),
  deletedAt: null,
  ...overrides
})

const page = (
  changes: SyncSecret[],
  nextCursor: string,
  hasMore = false
): SyncPage => ({
  changes: changes.map((secret) => ({ cursor: nextCursor, secret })),
  nextCursor,
  hasMore
})

const mockFetch = () =>
  vi.fn<(input: VaultApiInputs['mobile']['sync']) => Promise<SyncPage>>()

describe('collectVaultChanges', () => {
  it('follows every page and returns the final cursor with the latest change for each item', async () => {
    const fetchPage = mockFetch()
      .mockResolvedValueOnce(page([synced()], 'cursor-10', true))
      .mockResolvedValueOnce(
        page(
          [
            synced({ version: 2, encrypted: 'new-value' }),
            synced({
              id: '22222222-2222-4222-8222-222222222222',
              deletedAt: '2026-09-08T11:00:00.000Z',
              encrypted: ''
            })
          ],
          'cursor-20'
        )
      )

    const result = await collectVaultChanges(fetchPage, 'cursor-5')

    expect(fetchPage.mock.calls.map(([input]) => input)).toEqual([
      { cursor: 'cursor-5', limit: 200 },
      { cursor: 'cursor-10', limit: 200 }
    ])
    expect(result.cursor).toBe('cursor-20')
    expect(result.secrets).toEqual([
      synced({ version: 2, encrypted: 'new-value' }),
      synced({
        id: '22222222-2222-4222-8222-222222222222',
        deletedAt: '2026-09-08T11:00:00.000Z',
        encrypted: ''
      })
    ])
  })

  it('does not expose a partial result or consume the saved cursor if a later page fails', async () => {
    const failure = new Error('Connection interrupted')
    const fetchPage = mockFetch()
      .mockResolvedValueOnce(page([synced()], 'cursor-10', true))
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(page([synced({ version: 2 })], 'cursor-11'))

    await expect(collectVaultChanges(fetchPage, 'cursor-5')).rejects.toBe(
      failure
    )
    const retry = await collectVaultChanges(fetchPage, 'cursor-5')

    expect(fetchPage).toHaveBeenNthCalledWith(3, {
      cursor: 'cursor-5',
      limit: 200
    })
    expect(retry).toEqual({
      secrets: [synced({ version: 2 })],
      cursor: 'cursor-11'
    })
  })

  it('accepts an empty final page but rejects nonadvancing pagination', async () => {
    const fetchPage = mockFetch().mockResolvedValue(page([], 'cursor-5'))
    expect(await collectVaultChanges(fetchPage, 'cursor-5')).toEqual({
      secrets: [],
      cursor: 'cursor-5'
    })
    fetchPage.mockResolvedValue(page([], 'cursor-5', true))
    await expect(
      collectVaultChanges(fetchPage, 'cursor-5')
    ).rejects.toMatchObject({
      message: 'Vault sync did not advance its cursor'
    })
  })
})

describe('mergeVaultChanges', () => {
  it('applies updates and redacted tombstones without mutating the current snapshot', () => {
    const current = [
      secret(),
      secret({ id: '22222222-2222-4222-8222-222222222222' })
    ]
    const result = mergeVaultChanges(current, [
      synced({
        version: 2,
        encrypted: 'updated',
        updatedAt: '2026-09-08T11:00:00.000Z'
      }),
      synced({
        id: '22222222-2222-4222-8222-222222222222',
        version: 2,
        encrypted: '',
        deletedAt: '2026-09-08T11:01:00.000Z'
      })
    ])

    expect(result).toEqual([
      secret({
        version: 2,
        encrypted: 'updated',
        updatedAt: '2026-09-08T11:00:00.000Z'
      })
    ])
    expect(current).toHaveLength(2)
    expect(current[0]!.version).toBe(1)
  })

  it('preserves a newer local write when an older sync response arrives afterward', () => {
    const newerLocal = secret({ version: 3, encrypted: 'local-write' })
    expect(
      mergeVaultChanges(
        [newerLocal],
        [synced({ version: 2, encrypted: 'old-write' })]
      )
    ).toEqual([newerLocal])
    expect(
      mergeVaultChanges(
        [newerLocal],
        [synced({ version: 2, deletedAt: '2026-09-08T11:00:00.000Z' })]
      )
    ).toEqual([newerLocal])
  })

  it('does not resurrect a locally deleted item from a stale in-flight sync page', () => {
    const deletedVersions = new Map([[secret().id, 3]])
    expect(
      mergeVaultChanges([], [synced({ version: 2 })], deletedVersions)
    ).toEqual([])
    expect(
      mergeVaultChanges([], [synced({ version: 3 })], deletedVersions)
    ).toEqual([])
    // Allow a future explicit server-side restoration at a genuinely newer revision.
    expect(
      mergeVaultChanges([], [synced({ version: 4 })], deletedVersions)
    ).toEqual([secret({ version: 4 })])
    expect(deletedVersions.get(secret().id)).toBe(3)
  })

  it('sorts merged items by their update timestamp or creation timestamp', () => {
    const current = secret()
    const recent = synced({
      id: '22222222-2222-4222-8222-222222222222',
      createdAt: '2026-09-08T11:00:00.000Z'
    })
    const oldest = synced({
      id: '33333333-3333-4333-8333-333333333333',
      createdAt: '2026-09-08T09:00:00.000Z'
    })
    expect(
      mergeVaultChanges([current], [oldest, recent]).map(({ id }) => id)
    ).toEqual([recent.id, current.id, oldest.id])
  })
})
