import { useEffect, useRef, useState } from 'react'
import { FiShield, FiShieldOff } from 'react-icons/fi'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { Button } from '@src/components/ui/button'

const policies = [
  {
    value: UserNewDevicePolicy.REQUIRE_ANY_DEVICE_APPROVAL,
    title: 'Require approval from another device',
    description:
      'Approve each new device from a device already signed in to your account.',
    Icon: FiShield
  },
  {
    value: UserNewDevicePolicy.ALLOW,
    title: 'Allow any new device',
    description:
      'New devices can sign in with your password. You’ll be notified when they do.',
    Icon: FiShieldOff
  }
]

type Props = {
  onSave: (policy: UserNewDevicePolicy) => Promise<void>
  saving: boolean
  error?: string
}

export function NewDevicePolicyDialog({ onSave, saving, error }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedPolicy, setSelectedPolicy] =
    useState<UserNewDevicePolicy | null>(null)

  // The native modal supplies focus trapping and makes the vault behind it inert.
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="device-policy-title"
      aria-describedby="device-policy-description"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-0 text-[color:var(--color-foreground)] shadow-2xl backdrop:bg-black/65"
    >
      <form
        className="p-5 sm:p-8"
        aria-busy={saving}
        onSubmit={(event) => {
          event.preventDefault()
          if (selectedPolicy && !saving) void onSave(selectedPolicy)
        }}
      >
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-primary)]">
          <FiShield className="size-6" aria-hidden="true" />
        </div>
        <h1
          id="device-policy-title"
          className="text-2xl font-bold tracking-tight"
        >
          New device policy
        </h1>
        <p
          id="device-policy-description"
          className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]"
        >
          Choose how new devices can access your vault. You can change this
          later in Settings.
        </p>
        <fieldset disabled={saving} className="mt-6 space-y-3">
          <legend className="mb-3 text-sm font-semibold">
            When a new device signs in
          </legend>
          {policies.map(({ value, title, description, Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--color-border)] p-4 transition hover:bg-[color:var(--color-accent)] has-[:checked]:border-[color:var(--color-primary)] has-[:checked]:bg-[color:var(--color-accent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--color-ring)]"
            >
              <input
                type="radio"
                name="newDevicePolicy"
                value={value}
                checked={selectedPolicy === value}
                onChange={() => setSelectedPolicy(value)}
                aria-describedby={`policy-description-${value}`}
                className="mt-1 size-4 shrink-0 accent-[color:var(--color-primary)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-6">
                  {title}
                </span>
                <span
                  id={`policy-description-${value}`}
                  className="mt-1 block text-sm leading-6 text-[color:var(--color-muted)]"
                >
                  {description}
                </span>
              </span>
              <Icon
                className="mt-1 hidden size-5 shrink-0 text-[color:var(--color-muted)] sm:block"
                aria-hidden="true"
              />
            </label>
          ))}
        </fieldset>
        {error && (
          <p
            role="alert"
            className="mt-4 break-words rounded-xl bg-[color:var(--color-danger-bg)] p-3 text-sm text-[color:var(--color-danger)]"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={!selectedPolicy || saving}
          >
            {saving ? 'Saving…' : 'Save policy'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
