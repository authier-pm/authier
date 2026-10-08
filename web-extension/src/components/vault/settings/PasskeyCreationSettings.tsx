import { useEffect, useState } from 'react'
import { passkeyCreationVerification } from '@src/passkeys/passkeyCreationPreference'
import { PasskeyCreationChoices } from './PasskeyCreationChoices'

export function PasskeyCreationSettings() {
  const [verify, setVerify] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // This preference lives in browser storage, independently of account settings.
  useEffect(() => {
    let active = true
    void passkeyCreationVerification.get().then(
      (value) => {
        if (active) setVerify(value)
      },
      () => {
        if (active)
          setError(
            'Could not load the passkey setting. Reopen settings to try again.'
          )
      }
    )
    return () => {
      active = false
    }
  }, [])

  const select = async (value: boolean) => {
    setSaving(true)
    setSaved(false)
    setError('')
    await passkeyCreationVerification.set(value).then(
      () => {
        setVerify(value)
        setSaved(true)
      },
      () => setError('Could not save the passkey setting. Please try again.')
    )
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <PasskeyCreationChoices
        verify={verify}
        onChange={(value) => void select(value)}
        disabled={saving}
        scope="device"
      />
      <p role="status" className="text-xs text-[color:var(--color-muted)]">
        {saved
          ? 'Saved on this device.'
          : 'Changes save automatically on this device only.'}
      </p>
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
