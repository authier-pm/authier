import { useState } from 'react'
import { NewDeviceApprovalChoices } from '@shared/NewDeviceApprovalChoices'
import type { NewDeviceApprovalPolicy } from '@shared/newDeviceApproval'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { Button } from '@src/components/ui/button'
import { device } from '@src/background/ExtensionDevice'
import {
  GetUserNewDevicePolicyDocument,
  useGetUserNewDevicePolicyQuery,
  useUpdateNewDevicePolicyMutation
} from './NewDevicePolicyOnboarding.codegen'

function ApprovalSettingsForm({
  initialPolicy,
  editable
}: {
  initialPolicy: NewDeviceApprovalPolicy | null
  editable: boolean
}) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [saved, setSaved] = useState(false)
  const [updatePolicy, { loading, error }] = useUpdateNewDevicePolicyMutation({
    refetchQueries: [{ query: GetUserNewDevicePolicyDocument }],
    awaitRefetchQueries: true,
    errorPolicy: 'all'
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!policy || loading || !editable) return
        setSaved(false)
        void updatePolicy({
          variables: { newDevicePolicy: UserNewDevicePolicy[policy] }
        }).then((result) => setSaved(!result.error))
      }}
    >
      <NewDeviceApprovalChoices
        value={policy}
        onChange={(next) => {
          setPolicy(next)
          setSaved(false)
        }}
        disabled={loading || !editable}
      />
      {!editable && (
        <p className="text-sm text-[color:var(--color-muted)]">
          Open your master device to change approval settings.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error.message}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm">
          Approval methods saved.
        </p>
      )}
      <Button
        type="submit"
        disabled={!policy || policy === initialPolicy || loading || !editable}
      >
        {loading ? 'Saving…' : 'Save approval methods'}
      </Button>
    </form>
  )
}

export function NewDeviceApprovalSettings() {
  const { data } = useGetUserNewDevicePolicyQuery({
    fetchPolicy: 'cache-and-network'
  })
  if (!data) return null
  return (
    <section className="space-y-4 border-b border-[color:var(--color-border)] pb-6">
      <div>
        <h2 className="text-lg font-semibold">New device approval</h2>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Every new device needs approval before it can access your vault.
        </p>
      </div>
      <ApprovalSettingsForm
        key={data.me.newDevicePolicy}
        initialPolicy={data.me.newDevicePolicy}
        editable={
          data.me.newDevicePolicy === null ||
          device.id === data.me.masterDeviceId
        }
      />
    </section>
  )
}
