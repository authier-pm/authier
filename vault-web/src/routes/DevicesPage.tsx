import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { orpc, orpcClient } from '@/lib/orpc'
import { useVaultSession } from '@/providers/VaultSessionProvider'

export function DevicesPage() {
  const { session } = useVaultSession()
  const devicesQuery = useQuery(orpc.devices.list.queryOptions({ input: {} }))
  const challengesQuery = useQuery(
    orpc.devices.listPendingChallenges.queryOptions({ input: {} })
  )

  const approveMutation = useMutation({
    ...orpc.devices.approveChallenge.mutationOptions(),
    mutationFn: (input: { id: number }) =>
      orpcClient.devices.approveChallenge(input)
  })

  const rejectMutation = useMutation({
    ...orpc.devices.rejectChallenge.mutationOptions(),
    mutationFn: (input: { id: number }) =>
      orpcClient.devices.rejectChallenge(input)
  })

  const refreshLists = () =>
    Promise.all([devicesQuery.refetch(), challengesQuery.refetch()])

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
          <CardDescription>
            Review and approve new browser or device logins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challengesQuery.data?.challenges.map((challenge) => (
            <Card
              className="border-dashed border-white/10 bg-[color:var(--color-surface-muted)]"
              key={challenge.id}
            >
              <CardContent className="space-y-3 p-5">
                <div>
                  <h3 className="text-lg font-semibold">{challenge.deviceName}</h3>
                  <p className="text-sm text-[color:var(--color-muted)]">
                    {challenge.ipAddress} ·{' '}
                    {new Date(challenge.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={approveMutation.isPending}
                    onClick={() => {
                      void approveMutation
                        .mutateAsync({ id: challenge.id })
                        .then(() => {
                          void refreshLists()
                        })
                    }}
                    size="sm"
                    type="button"
                  >
                    Approve
                  </Button>
                  <Button
                    disabled={rejectMutation.isPending}
                    onClick={() => {
                      void rejectMutation
                        .mutateAsync({ id: challenge.id })
                        .then(() => {
                          void refreshLists()
                        })
                    }}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {challengesQuery.data?.challenges.length === 0 ? (
            <p className="text-sm text-[color:var(--color-muted)]">
              No pending approvals right now.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <CardTitle>Your devices</CardTitle>
          <CardDescription>
            Rename, remove, or promote trusted devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {devicesQuery.data?.devices.map((device) => (
            <Card
              className="border-dashed border-white/10 bg-[color:var(--color-surface-muted)]"
              key={device.id}
            >
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold">{device.name}</h3>
                  {device.id === session?.currentDevice.id ? (
                    <span className="rounded-full bg-[color:var(--color-primary)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary-foreground)]">
                      current
                    </span>
                  ) : null}
                  {device.id === session?.user.masterDeviceId ? (
                    <span className="rounded-full bg-[color:var(--color-secondary)] px-3 py-1 text-xs font-semibold text-white">
                      master
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-[color:var(--color-muted)]">
                  {device.platform} · Last location {device.lastGeoLocation}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      const nextName = window.prompt('Rename device', device.name)

                      if (!nextName) {
                        return
                      }

                      void orpcClient.devices
                        .rename({
                          id: device.id,
                          name: nextName
                        })
                        .then(() => {
                          void refreshLists()
                        })
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Rename
                  </Button>

                  {device.id !== session?.user.masterDeviceId ? (
                    <>
                      <Button
                        onClick={() => {
                          void orpcClient.devices.logout({ id: device.id }).then(() => {
                            void refreshLists()
                          })
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Log out
                      </Button>
                      <Button
                        onClick={() => {
                          void orpcClient.devices.remove({ id: device.id }).then(() => {
                            void refreshLists()
                          })
                        }}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        Remove
                      </Button>
                    </>
                  ) : null}

                  {session?.user.masterDeviceId !== device.id ? (
                    <Button
                      onClick={() => {
                        void orpcClient.devices
                          .setMaster({
                            newMasterDeviceId: device.id
                          })
                          .then(() => {
                            void refreshLists()
                          })
                      }}
                      size="sm"
                      type="button"
                    >
                      Make master
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
