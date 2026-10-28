import { createOfflineVaultSnapshot } from './offlineVault'

/** Production-extension scenario: a mixed vault plus a future opaque item. */
export async function createPendingVaultSnapshot() {
  const snapshot = await createOfflineVaultSnapshot()
  snapshot.secrets.push({
    id: 'future-preview-item',
    kind: 'FUTURE_SECRET',
    encrypted: 'opaque-future-envelope',
    version: 1,
    createdAt: '2026-10-27T10:00:00.000Z'
  })
  return snapshot
}
