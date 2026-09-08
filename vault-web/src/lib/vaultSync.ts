import type { VaultApiInputs, VaultApiOutputs } from '@shared/orpc/contract'

type Secret = VaultApiOutputs['session']['bootstrap']['secrets'][number]
type SyncSecret = VaultApiOutputs['mobile']['sync']['changes'][number]['secret']
type SyncPage = VaultApiOutputs['mobile']['sync']
type FetchPage = (input: VaultApiInputs['mobile']['sync']) => Promise<SyncPage>

// Do not apply a partial page sequence or advance its cursor after a failed request.
export const collectVaultChanges = async (
  fetchPage: FetchPage,
  cursor?: string
) => {
  const changes = new Map<string, SyncSecret>()
  let nextCursor = cursor
  let hasMore = true

  while (hasMore) {
    const page = await fetchPage({ cursor: nextCursor, limit: 200 })
    if (page.hasMore && page.nextCursor === nextCursor) {
      throw new Error('Vault sync did not advance its cursor')
    }
    for (const change of page.changes)
      changes.set(change.secret.id, change.secret)
    nextCursor = page.nextCursor
    hasMore = page.hasMore
  }

  return { secrets: [...changes.values()], cursor: nextCursor }
}

export const mergeVaultChanges = (
  current: Secret[],
  changes: SyncSecret[],
  deletedVersions: ReadonlyMap<string, number> = new Map()
) => {
  const next = new Map(current.map((secret) => [secret.id, secret]))
  for (const change of changes) {
    // A completed local deletion must also win over an older in-flight page.
    const deletedVersion = deletedVersions.get(change.id)
    if (deletedVersion !== undefined && change.version <= deletedVersion)
      continue
    // A local write may have completed while an older sync response was in flight.
    const existing = next.get(change.id)
    if (existing && existing.version > change.version) continue
    if (change.deletedAt) {
      next.delete(change.id)
    } else {
      const { deletedAt: _deletedAt, ...secret } = change
      next.set(secret.id, secret)
    }
  }
  return [...next.values()].sort(
    (left, right) =>
      Date.parse(right.updatedAt ?? right.createdAt) -
      Date.parse(left.updatedAt ?? left.createdAt)
  )
}
