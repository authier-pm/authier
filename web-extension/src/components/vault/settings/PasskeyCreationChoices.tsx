import { cn } from '@src/lib/cn'

const choices = [
  {
    verify: true,
    label: 'Always verify identity when creating a passkey',
    description: 'Enter your master password before saving each new passkey.'
  },
  {
    verify: false,
    label: 'Allow creating new passkeys when the vault is unlocked',
    description:
      'Approve with Save passkey. If the vault is locked, enter your master password to unlock it.'
  }
]

export function PasskeyCreationChoices({
  verify,
  onChange,
  disabled = false,
  scope
}: {
  verify: boolean | null
  onChange: (value: boolean) => void
  disabled?: boolean
  scope: 'device' | 'defaults'
}) {
  const isDefault = scope === 'defaults'
  return (
    <fieldset disabled={verify === null || disabled} className="space-y-3">
      <legend className="text-base font-semibold text-[color:var(--color-foreground)]">
        {isDefault ? 'Creating passkeys on new devices' : 'Creating passkeys'}
      </legend>
      <p className="text-sm leading-6 text-[color:var(--color-muted)]">
        {isDefault
          ? 'New devices start with this choice. You can change it on each device under Security. Existing devices keep their own setting.'
          : 'Choose how to approve new passkeys in this browser. Signing in with a passkey still requires identity verification.'}
      </p>
      {choices.map((choice) => (
        <label
          key={String(choice.verify)}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition',
            verify === choice.verify
              ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10'
              : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]'
          )}
        >
          <input
            type="radio"
            name={`passkeyCreationVerification-${scope}`}
            checked={verify === choice.verify}
            onChange={() => onChange(choice.verify)}
            className="mt-1 size-4 shrink-0 accent-[color:var(--color-primary)]"
          />
          <span>
            <span className="block text-sm font-medium text-[color:var(--color-foreground)]">
              {choice.label} {isDefault ? 'on new devices' : 'on this device'}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[color:var(--color-muted)]">
              {choice.description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
