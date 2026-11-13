import { useEffect, useState } from 'react'
import { hasDeviceUnlock } from './deviceUnlock'

export function DeviceUnlockButton({
  accountId,
  onUnlock
}: {
  accountId: string
  onUnlock: () => Promise<void>
}) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    void hasDeviceUnlock(accountId)
      .then((value) => {
        if (!cancelled) setEnabled(value)
      })
      .catch(() => {
        // A storage failure must leave master-password unlock available.
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])
  if (!enabled) return null
  const unlock = async () => {
    setBusy(true)
    setError('')
    await onUnlock()
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Passkey unlock failed. Use your master password.'
        )
      )
      .finally(() => setBusy(false))
  }
  return (
    <div className="space-y-2">
      <button
        className="w-full rounded-lg border border-[color:var(--color-border)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
        type="button"
        disabled={busy}
        onClick={() => void unlock()}
      >
        {busy ? 'Waiting for your passkey…' : 'Unlock with passkey'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
