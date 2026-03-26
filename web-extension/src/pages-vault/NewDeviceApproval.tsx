import { Trans } from '@lingui/react/macro'
import { formatRelative } from 'date-fns'
import { Button } from '@src/components/ui/button'
import { device } from '@src/background/ExtensionDevice'
import {
  useApproveChallengeMutation,
  useDevicesRequestsQuery,
  useRejectChallengeMutation
} from '@shared/graphql/AccountDevices.codegen'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL } from './LoginAwaitingApproval'
import { useDevicesListWithDataQuery } from './Devices.codegen'

export const NewDevicesApprovalStack = () => {
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()
  const { data: devicesRequests, refetch } = useDevicesRequestsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()

  const showMasterDevicePolicyHint =
    device.id !== devicesRequests?.me.masterDeviceId &&
    devicesRequests?.me.newDevicePolicy ===
      UserNewDevicePolicy.REQUIRE_MASTER_DEVICE_APPROVAL

  return (
    <div className="mt-3 space-y-3">
      {devicesRequests?.me?.decryptionChallengesWaiting.map(
        (challengeToApprove) => {
          const parts = [
            challengeToApprove.ipGeoLocation?.city,
            challengeToApprove.ipGeoLocation?.country_name
          ].filter(Boolean)

          return (
            <div
              className="rounded-[var(--radius-lg)] border border-amber-400/50 bg-amber-500/10 p-4"
              key={challengeToApprove.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="text-sm text-[color:var(--color-foreground)]">
                  <Trans>
                    New device "{challengeToApprove.deviceName}" tried to login{' '}
                    {formatRelative(
                      new Date(challengeToApprove.createdAt),
                      new Date()
                    )}
                  </Trans>
                  :{' '}
                  <Trans>
                    from IP {challengeToApprove.ipAddress} ({parts.join(', ')})
                  </Trans>
                </div>

                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={async () => {
                      await reject({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      await refetch()
                    }}
                    variant="destructive"
                  >
                    <Trans>Reject</Trans>
                  </Button>
                  <Button
                    onClick={async () => {
                      await approve({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      await refetch()
                      setTimeout(() => {
                        devicesRefetch()
                      }, LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL)
                    }}
                    variant="primary"
                  >
                    <Trans>Approve</Trans>
                  </Button>
                </div>
              </div>
            </div>
          )
        }
      )}
      {showMasterDevicePolicyHint ? (
        <div className="text-center text-sm text-[color:var(--color-muted)]">
          <Trans>Open device list on your master device to approve</Trans>
        </div>
      ) : null}
    </div>
  )
}
