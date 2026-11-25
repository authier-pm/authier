import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NewDeviceApprovalChoices } from '@shared/NewDeviceApprovalChoices'
import type { NewDeviceApprovalPolicy } from '@shared/newDeviceApproval'
import { Button } from '@/components/ui/button'
import { orpc, orpcClient } from '@/lib/orpc'
import { useVaultSession } from '@/providers/VaultSessionProvider'

function ApprovalForm({
  initialPolicy,
  editable = true
}: {
  initialPolicy: NewDeviceApprovalPolicy | null
  editable?: boolean
}) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!policy || saving || !editable) return
        setSaving(true)
        setError('')
        void orpcClient.security
          .updateNewDevicePolicy({ newDevicePolicy: policy })
          .then((result) => {
            queryClient.setQueryData(
              orpc.security.get.queryOptions({ input: {} }).queryKey,
              result
            )
          })
          .catch((cause: unknown) => {
            setError(
              cause instanceof Error
                ? cause.message
                : 'Unable to save approval methods'
            )
          })
          .finally(() => setSaving(false))
      }}
    >
      <NewDeviceApprovalChoices
        value={policy}
        onChange={setPolicy}
        disabled={saving || !editable}
      />
      {!editable && (
        <p className="text-sm text-[color:var(--color-muted)]">
          Open your master device to change approval settings.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!policy || saving || policy === initialPolicy || !editable}
      >
        {saving ? 'Saving…' : 'Save approval methods'}
      </Button>
    </form>
  )
}

export function NewDeviceApprovalSettings() {
  const { session } = useVaultSession()
  const { data } = useQuery(orpc.security.get.queryOptions({ input: {} }))
  if (!data) return null
  return (
    <ApprovalForm
      key={data.security.newDevicePolicy}
      initialPolicy={data.security.newDevicePolicy}
      editable={
        data.security.newDevicePolicy === null ||
        session?.currentDevice.id === data.security.masterDeviceId
      }
    />
  )
}

function ApprovalOnboardingDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="approval-onboarding-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 text-[color:var(--color-foreground)] shadow-2xl backdrop:bg-black/65 sm:p-8"
    >
      <h1 id="approval-onboarding-title" className="text-2xl font-bold">
        New device approval
      </h1>
      <p className="mt-3 mb-6 text-sm leading-6 text-[color:var(--color-muted)]">
        Choose how you will approve new devices. Enable one method or both. You
        can change this later in Security settings.
      </p>
      <ApprovalForm initialPolicy={null} />
    </dialog>
  )
}

export function NewDeviceApprovalOnboarding() {
  const { data } = useQuery(orpc.security.get.queryOptions({ input: {} }))
  if (data?.security.newDevicePolicy !== null) return null
  return <ApprovalOnboardingDialog />
}
