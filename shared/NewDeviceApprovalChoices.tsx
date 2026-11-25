import { useId } from 'react'
import type { NewDeviceApprovalPolicy } from './newDeviceApproval'

type Props = {
  value: NewDeviceApprovalPolicy | null
  onChange: (policy: NewDeviceApprovalPolicy | null) => void
  disabled?: boolean
}

export function NewDeviceApprovalChoices({ value, onChange, disabled }: Props) {
  const id = useId()
  const email =
    value === 'EMAIL' ||
    value === 'EMAIL_OR_OTHER_DEVICE' ||
    value === 'EMAIL_AND_OTHER_DEVICE'
  const device =
    value === 'OTHER_DEVICE' ||
    value === 'EMAIL_OR_OTHER_DEVICE' ||
    value === 'EMAIL_AND_OTHER_DEVICE'
  const setMethods = (nextEmail: boolean, nextDevice: boolean) => {
    if (nextEmail && nextDevice) {
      onChange(
        value === 'EMAIL_AND_OTHER_DEVICE' ? value : 'EMAIL_OR_OTHER_DEVICE'
      )
      return
    }
    if (nextDevice) onChange('OTHER_DEVICE')
    else if (nextEmail) onChange('EMAIL')
    else onChange(null)
  }

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="mb-3 text-sm font-semibold">
        Choose at least one approval method
      </legend>
      <ApprovalMethod
        title="Another Authier device"
        description="Approve from another device already signed in to Authier. Choose this on its own for our recommended protection."
        recommended
        checked={device}
        onChange={(checked) => setMethods(email, checked)}
      />
      <ApprovalMethod
        title="Master device only"
        description="Only your current master device can approve new logins and receives approval notifications. Selecting this replaces the other methods."
        badge="Master only"
        checked={value === 'MASTER_DEVICE'}
        onChange={(checked) => onChange(checked ? 'MASTER_DEVICE' : null)}
      />
      <ApprovalMethod
        title="Email"
        description="Approve through a link sent to your account email. Email alone is the least secure option: anyone with access to your mailbox can approve a login."
        checked={email}
        onChange={(checked) => setMethods(checked, device)}
      />
      {email && device && (
        <fieldset className="space-y-3 rounded-2xl border border-[color:var(--color-border)] p-4">
          <legend className="px-1 text-sm font-semibold">
            When both methods are enabled
          </legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name={`${id}-approval-mode`}
              checked={value === 'EMAIL_OR_OTHER_DEVICE'}
              onChange={() => onChange('EMAIL_OR_OTHER_DEVICE')}
              className="mt-1 size-4 shrink-0 accent-[color:var(--color-primary)]"
            />
            <span>
              Either approval is enough
              <span className="mt-1 block text-xs leading-5 text-[color:var(--color-muted)]">
                Use email or another device. Email remains the less secure way
                in.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name={`${id}-approval-mode`}
              checked={value === 'EMAIL_AND_OTHER_DEVICE'}
              onChange={() => onChange('EMAIL_AND_OTHER_DEVICE')}
              className="mt-1 size-4 shrink-0 accent-[color:var(--color-primary)]"
            />
            <span>
              Require both approvals
              <span className="mt-1 block text-xs leading-5 text-[color:var(--color-muted)]">
                Approve by email and from another Authier device for every new
                device.
              </span>
            </span>
          </label>
        </fieldset>
      )}
      <p className="text-xs leading-5 text-[color:var(--color-muted)]">
        Your master password is always required after approval.
      </p>
    </fieldset>
  )
}

function ApprovalMethod({
  title,
  description,
  recommended = false,
  badge = 'Most convenient',
  checked,
  onChange
}: {
  title: string
  description: string
  recommended?: boolean
  badge?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--color-border)] p-4 transition hover:bg-[color:var(--color-accent)] has-[:checked]:border-[color:var(--color-primary)] has-[:checked]:bg-[color:var(--color-accent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--color-ring)]">
      <input
        type="checkbox"
        aria-label={title}
        aria-describedby={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-[color:var(--color-primary)]"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold leading-6">
          {title}
          <span
            className={
              recommended
                ? 'rounded-full bg-[color:var(--color-primary)]/15 px-2 py-0.5 text-[11px] text-[color:var(--color-primary)]'
                : 'rounded-full bg-[color:var(--color-surface-muted)] px-2 py-0.5 text-[11px] text-[color:var(--color-muted)]'
            }
          >
            {recommended ? 'Recommended' : badge}
          </span>
        </span>
        <span
          id={id}
          className="mt-1 block text-sm leading-6 text-[color:var(--color-muted)]"
        >
          {description}
        </span>
      </span>
    </label>
  )
}
