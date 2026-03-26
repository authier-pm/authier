import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, inputClassName } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { orpc, orpcClient } from '@/lib/orpc'

const lockTimeoutOptions = [300, 1800, 3600, 28800, 86400, 0]

export function SecurityPage() {
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

      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <CardTitle>Recovery cooldown</CardTitle>
          <CardDescription>
            Delay before a recovery-based device reset can finish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="cooldown">Minutes</Label>
          <Input
            defaultValue={security.deviceRecoveryCooldownMinutes}
            id="cooldown"
            min={0}
            onBlur={(event) => {
              void orpcClient.security
                .updateRecoveryCooldown({
                  deviceRecoveryCooldownMinutes: Number(event.target.value)
                })
                .then(() => {
                  void securityQuery.refetch()
                })
            }}
            type="number"
          />
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
