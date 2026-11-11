import { MAX_VAULT_LOCK_TIMEOUT_SECONDS } from '@shared/orpc/schemas'

const defaultTimeoutSeconds = 28_800

export type VaultLockState = {
  vaultLockTimeoutSeconds: number | null
  lockTimeEnd?: number | null
}

/** Repair legacy values produced by treating an epoch timestamp as seconds. */
export const normalizeVaultLockTimeout = (seconds: number | null) => {
  if (
    seconds === null ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    seconds > MAX_VAULT_LOCK_TIMEOUT_SECONDS
  )
    return defaultTimeoutSeconds
  return seconds
}

export const newVaultLockDeadline = (
  seconds: number | null,
  now = Date.now()
) => {
  const timeout = normalizeVaultLockTimeout(seconds)
  return timeout === 0 ? null : now + timeout * 1000
}

export const isVaultLockExpired = (state: VaultLockState, now = Date.now()) => {
  const timeout = normalizeVaultLockTimeout(state.vaultLockTimeoutSeconds)
  if (timeout === 0) return false
  const deadline = state.lockTimeEnd
  return (
    !Number.isSafeInteger(deadline) ||
    deadline === null ||
    deadline === undefined ||
    deadline <= now ||
    deadline > now + timeout * 1000
  )
}
