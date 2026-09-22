import { formatTotpLabel, isTotpAccountEmail } from '@shared/totpLabel'
import { Input } from '@src/components/ui/input'

export const TotpLabelFields = ({
  email,
  provider,
  onEmailChange,
  onProviderChange
}: {
  email: string
  provider: string
  onEmailChange: (value: string) => void
  onProviderChange: (value: string) => void
}) => (
  <div className="grid min-w-0 gap-4">
    <label className="grid gap-2 text-sm font-medium">
      Account email
      <Input
        type="email"
        required
        value={email}
        placeholder="you@example.com"
        onChange={(event) => onEmailChange(event.target.value)}
      />
    </label>
    <label className="grid gap-2 text-sm font-medium">
      Provider
      <Input
        value={provider}
        placeholder="Microsoft"
        onChange={(event) => onProviderChange(event.target.value)}
      />
    </label>
    <div className="min-w-0 rounded-lg border border-[color:var(--color-border)] p-3">
      <p className="text-xs text-[color:var(--color-muted)]">Saved label</p>
      <p className="mt-1 break-words text-sm font-medium" data-totp-label>
        {isTotpAccountEmail(email)
          ? formatTotpLabel(email, provider)
          : 'Enter the account email to identify this code.'}
      </p>
    </div>
  </div>
)
