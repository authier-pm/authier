import { useState } from 'react'
import { MasterDeviceResetSetup } from '../../../shared/MasterDeviceResetSetup'
import { useVaultSession } from '@/providers/VaultSessionProvider'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { inputClassName } from '@/components/ui/input'
import { orpc, orpcClient } from '@/lib/orpc'

const lockTimeoutOptions = [300, 1800, 3600, 28800, 86400, 0]

export function SecurityPage() {
  const { session } = useVaultSession()
  const [saving, setSaving] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const securityQuery = useQuery(orpc.security.get.queryOptions({ input: {} }))
  const security = securityQuery.data?.security

  if (!security) {
    return null
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px] lg:col-span-2">
        <CardHeader>
          <CardTitle>Approval policy</CardTitle>
          <CardDescription>
            Decide which device can approve new browser sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className={`${inputClassName} h-10 px-3`}
            defaultValue={security.newDevicePolicy ?? 'ALLOW'}
            onChange={(event) => {
              void orpcClient.security
                .updateNewDevicePolicy({
                  newDevicePolicy: event.target.value as
                    | 'ALLOW'
                    | 'REQUIRE_ANY_DEVICE_APPROVAL'
                    | 'REQUIRE_MASTER_DEVICE_APPROVAL'
                })
                .then(() => {
                  void securityQuery.refetch()
                })
            }}
          >
            <option value="ALLOW">Allow immediately</option>
            <option value="REQUIRE_ANY_DEVICE_APPROVAL">
              Require any approved device
            </option>
            <option value="REQUIRE_MASTER_DEVICE_APPROVAL">
              Require master device approval
            </option>
          </select>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[color:var(--color-surface)] lg:col-span-3">
        <CardContent className="p-6">
          {session?.currentDevice.id === security.masterDeviceId ? (
            <MasterDeviceResetSetup
              initialConfig={security.masterDeviceResetConfig}
              email={session?.user.email ?? 'your account email'}
              busy={saving}
              submitLabel="Save recovery settings"
              onSave={async (config) => {
                setSaving(true)
                setRecoveryMessage('')
                await orpcClient.security
                  .updateResetConfig(config)
                  .then(async () => {
                    await securityQuery.refetch()
                    setRecoveryMessage(
                      'Saved. Pending resets keep their original rules.'
                    )
                  })
                  .catch((error: unknown) =>
                    setRecoveryMessage(
                      error instanceof Error ? error.message : 'Unable to save'
                    )
                  )
                  .finally(() => setSaving(false))
              }}
            />
          ) : (
            <p>Open your master device to change recovery settings.</p>
          )}
          {recoveryMessage && (
            <p role="status" className="mt-3 text-sm">
              {recoveryMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px] lg:col-span-3">
        <CardHeader>
          <CardTitle>Vault lock timeout</CardTitle>
          <CardDescription>
            Control when this web vault locks locally after inactivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {lockTimeoutOptions.map((seconds) => (
            <Button
              key={seconds}
              onClick={() => {
                void orpcClient.security
                  .updateVaultLockTimeout({
                    vaultLockTimeoutSeconds: seconds
                  })
                  .then(() => {
                    void securityQuery.refetch()
                  })
              }}
              size="sm"
              type="button"
              variant={
                security.vaultLockTimeoutSeconds === seconds
                  ? 'primary'
                  : 'outline'
              }
            >
              {seconds === 0 ? 'Never' : `${Math.max(seconds / 60, 1)} min`}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
