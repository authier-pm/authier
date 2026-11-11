import { useEffect, useRef, useState } from 'react'
import { FiShield } from 'react-icons/fi'
import { NewDeviceApprovalChoices } from '@shared/NewDeviceApprovalChoices'
import type { NewDeviceApprovalPolicy } from '@shared/newDeviceApproval'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { Button } from '@src/components/ui/button'

type Props = {
  onSave: (policy: UserNewDevicePolicy) => Promise<void>
  saving: boolean
  error?: string
}

export function NewDevicePolicyDialog({ onSave, saving, error }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedPolicy, setSelectedPolicy] =
    useState<NewDeviceApprovalPolicy | null>(null)

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
          if (selectedPolicy && !saving)
            void onSave(UserNewDevicePolicy[selectedPolicy])
        }}
      >
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-primary)]">
          <FiShield className="size-6" aria-hidden="true" />
        </div>
        <h1
          id="device-policy-title"
          className="text-2xl font-bold tracking-tight"
        >
          New device approval
        </h1>
        <p
          id="device-policy-description"
          className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]"
        >
          Choose how you will approve new devices. Enable one method or both.
          You can change this later in Security settings.
        </p>
        <div className="mt-6">
          <NewDeviceApprovalChoices
            value={selectedPolicy}
            onChange={setSelectedPolicy}
            disabled={saving}
          />
        </div>
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
            {saving ? 'Saving…' : 'Save approval methods'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
