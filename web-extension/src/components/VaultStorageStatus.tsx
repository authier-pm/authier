import { useContext } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

export function VaultStorageStatus() {
  const { deviceState } = useContext(DeviceStateContext)
  const pending = deviceState?.pendingSecretIds?.length ?? 0
  const unsupported = deviceState?.unsupportedSecretsCount ?? 0
  const previousKey = deviceState?.previousKeyPendingSecretsCount ?? 0
  if (!pending && !unsupported && !previousKey) return null
  return (
    <div
      role="status"
      className="mb-3 grid gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-6"
    >
      {pending > 0 && (
        <div>
          <p className="font-semibold">Saved on this device — sync pending</p>
          <p>
            {pending} {pending === 1 ? 'item is' : 'items are'} stored encrypted
            in this browser. Authier retries automatically. Synchronize before
            editing or deleting these items, or changing your password.
          </p>
        </div>
      )}
      {unsupported > 0 && (
        <p>
          {unsupported} {unsupported === 1 ? 'item needs' : 'items need'} a
          newer Authier version to display. Encrypted data is preserved.
        </p>
      )}
      {previousKey > 0 && (
        <p>
          {previousKey} locally saved{' '}
          {previousKey === 1 ? 'item uses' : 'items use'} an earlier vault
          password and cannot sync. The encrypted copies are retained in this
          browser; keep this profile and your previous password for recovery.
        </p>
      )}
    </div>
  )
}
