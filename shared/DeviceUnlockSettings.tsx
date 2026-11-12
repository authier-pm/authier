import { useEffect, useState } from 'react'
import { forgetDeviceUnlock, hasDeviceUnlock } from './deviceUnlock'

export function DeviceUnlockSettings({
  accountId,
  onEnable
}: {
  accountId: string
  onEnable: () => Promise<void>
}) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    void hasDeviceUnlock(accountId)
      .then((value) => {
        if (!cancelled) setEnabled(value)
      })
      .catch(() => {
        if (!cancelled) setError('Unable to read passkey settings. Try again.')
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  const update = async () => {
    setBusy(true)
    setError('')
    await (enabled ? forgetDeviceUnlock() : onEnable())
      .then(() => setEnabled(!enabled))
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to update passkey unlock'
        )
      )
      .finally(() => setBusy(false))
  }

  let buttonLabel = enabled
    ? 'Turn off passkey unlock'
    : 'Set up passkey unlock'
  if (busy) buttonLabel = 'Please wait…'
  return (
    <section className="space-y-3 rounded-xl border border-[color:var(--color-border)] p-4">
      <div>
        <h3 className="font-semibold">Unlock with a passkey</h3>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Use your device’s fingerprint, face or PIN, or a compatible security
          key. Your master password remains available.
        </p>
      </div>
      <p className="text-sm text-[color:var(--color-muted)]">
        After restarting your browser, approve a prompt to unlock. Use a passkey
        stored on your device or security key, outside your Authier vault.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void update()}
        className="rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      {enabled && (
        <p role="status" className="text-sm">
          Passkey unlock is enabled on this browser.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </section>
  )
}
