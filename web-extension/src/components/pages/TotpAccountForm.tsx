import { useState } from 'react'
import { formatTotpLabel, isTotpAccountEmail } from '@shared/totpLabel'
import { Button } from '@src/components/ui/button'
import { TotpLabelFields } from '../vault/addItem/TotpLabelFields'

export const TotpAccountForm = ({
  provider: initialProvider,
  onSave,
  onCancel
}: {
  provider: string
  onSave: (email: string, provider: string) => Promise<void>
  onCancel: () => void
}) => {
  const [email, setEmail] = useState('')
  const [provider, setProvider] = useState(initialProvider)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <form
      className="grid gap-4 rounded-lg border border-[color:var(--color-border)] p-4"
      onSubmit={async (event) => {
        event.preventDefault()
        formatTotpLabel(email, provider)
        setIsSaving(true)
        try {
          await onSave(email.trim(), provider.trim())
        } finally {
          setIsSaving(false)
        }
      }}
    >
      <p className="text-sm text-[color:var(--color-muted)]">
        This QR code does not include an email. Add the account email so you can
        tell your codes apart.
      </p>
      <TotpLabelFields
        email={email}
        provider={provider}
        onEmailChange={setEmail}
        onProviderChange={setProvider}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !isTotpAccountEmail(email)}>
          {isSaving ? 'Saving…' : 'Add TOTP'}
        </Button>
      </div>
    </form>
  )
}
