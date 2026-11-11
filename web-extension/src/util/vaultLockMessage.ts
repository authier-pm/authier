export const vaultLockMessage = { kind: 'authierVaultLocked' } as const

export const isVaultLockMessage = (message: unknown): boolean =>
  typeof message === 'object' &&
  message !== null &&
  'kind' in message &&
  message.kind === vaultLockMessage.kind
