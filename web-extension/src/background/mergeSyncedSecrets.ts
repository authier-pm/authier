import type { SecretSerializedType } from './backgroundPage'

export function mergeSyncedSecrets(
  current: readonly SecretSerializedType[],
  incoming: readonly SecretSerializedType[],
  pendingDeletedSecretIds: readonly string[] = []
) {
  const secrets = new Map(current.map((secret) => [secret.id, secret]))
  const pendingDeletions = new Set(pendingDeletedSecretIds)
  const confirmedDeletedSecretIds = new Set<string>()
  let removedSecrets = 0
  let newAndUpdatedSecrets = 0

  // Legacy sync replays the complete vault, including historical deletions.
  for (const secret of new Map(
    incoming.map((item) => [item.id, item])
  ).values()) {
    if (secret.deletedAt) {
      const existed = secrets.delete(secret.id)
      if (existed || pendingDeletions.has(secret.id)) removedSecrets++
      confirmedDeletedSecretIds.add(secret.id)
      continue
    }
    // A response fetched before a successful local delete must not restore it.
    if (pendingDeletions.has(secret.id)) continue
    const previous = secrets.get(secret.id)
    if (
      previous?.version !== undefined &&
      secret.version !== undefined &&
      previous.version > secret.version
    )
      continue

    if (
      !previous ||
      previous.encrypted !== secret.encrypted ||
      previous.kind !== secret.kind ||
      (previous.version !== undefined &&
        secret.version !== undefined &&
        previous.version !== secret.version)
    )
      newAndUpdatedSecrets++
    secrets.set(secret.id, secret)
  }

  return {
    secrets: [...secrets.values()],
    confirmedDeletedSecretIds,
    summary: { newAndUpdatedSecrets, removedSecrets }
  }
}
