import { useState } from 'react'
import { MasterDeviceResetSetup } from '@shared/MasterDeviceResetSetup'
import { masterDeviceResetConfigSchema } from '@shared/masterDeviceResetConfig'
import {
  useDefaultSettingsQuery,
  useUpdateMasterDeviceResetConfigMutation
} from '@shared/graphql/DefaultSettings.codegen'
import { device } from '@src/background/ExtensionDevice'

export function MasterDeviceRecoverySettings() {
  const { data, refetch } = useDefaultSettingsQuery()
  const [save, { loading }] = useUpdateMasterDeviceResetConfigMutation()
  const [message, setMessage] = useState('')
  if (!data) return null
  const config = masterDeviceResetConfigSchema.parse(
    data.me.masterDeviceResetConfig
  )
  return (
    <section className="mt-6 rounded-2xl border border-[color:var(--color-border)] p-6">
      {data.me.masterDeviceId === device.id ? (
        <MasterDeviceResetSetup
          initialConfig={config}
          email="your account email"
          submitLabel="Save recovery settings"
          busy={loading}
          onSave={async (config) => {
            setMessage('')
            await save({ variables: { config } })
              .then(async () => {
                await refetch()
                setMessage(
                  'Recovery settings saved. Pending resets keep their original rules.'
                )
              })
              .catch((error: unknown) =>
                setMessage(
                  error instanceof Error
                    ? error.message
                    : 'Unable to save recovery settings'
                )
              )
          }}
        />
      ) : (
        <p>
          Open your master device to change recovery settings. Current policy:{' '}
          {config.requiredApprovals} other device approvals and{' '}
          {config.waitMinutes} minutes.
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </section>
  )
}
