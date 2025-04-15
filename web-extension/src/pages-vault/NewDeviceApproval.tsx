import {
  Center,
  Button,
  Alert,
  VStack,
  Grid,
  Flex,
  Box
} from '@chakra-ui/react'
import { Trans } from '@lingui/react/macro'

import {
  useApproveChallengeMutation,
  useDevicesRequestsQuery,
  useRejectChallengeMutation
} from '@shared/graphql/AccountDevices.codegen'
import { formatRelative } from 'date-fns'
import { LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL } from './LoginAwaitingApproval'
import { useDevicesListWithDataQuery } from './Devices.codegen'
import { device } from '@src/background/ExtensionDevice'

export const NewDevicesApprovalStack = () => {
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()

  const { data: devicesRequests, refetch } = useDevicesRequestsQuery({
    fetchPolicy: 'cache-and-network'
  })

  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()

  const isMasterDevice = device.id === devicesRequests?.me.masterDeviceId
  // const isMasterDevice = true
  return (
    <VStack mt={3}>
      {devicesRequests?.me?.decryptionChallengesWaiting.map(
        (challengeToApprove) => {
          const parts = [
            challengeToApprove.ipGeoLocation?.city,
            challengeToApprove.ipGeoLocation?.country_name
          ].filter(Boolean)

          return (
            <Alert
              minW="90%"
              status="warning"
              display="grid"
              rounded={4}
              gridRowGap={1}
              maxW={500}
              key={challengeToApprove.id}
            >
              <Flex width={'full'}>
                <Center>
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
                </Center>
                {isMasterDevice && (
                  <Flex left={'auto'} marginLeft={'auto'} flexDirection={'row'}>
                    <Center>
                      <Button
                        // w="30%"
                        mx={2}
                        colorScheme="red"
                        onClick={async () => {
                          await reject({
                            variables: {
                              id: challengeToApprove.id
                            }
                          })
                          await refetch()
                        }}
                      >
                        <Trans>Reject</Trans>
                      </Button>
                    </Center>
                    <Center>
                      <Button
                        mx={2}
                        colorScheme="green"
                        onClick={async () => {
                          await approve({
                            variables: {
                              id: challengeToApprove.id
                            }
                          })
                          await refetch()
                          setTimeout(() => {
                            devicesRefetch()
                          }, LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL) // this is needed, because it takes time one the client side to do the decryption challenge
                        }}
                      >
                        <Trans>Approve</Trans>
                      </Button>
                    </Center>
                  </Flex>
                )}
              </Flex>
            </Alert>
          )
        }
      )}
      {!isMasterDevice && (
        <Center>
          <Trans>Open device list on your master device to approve</Trans>
        </Center>
      )}
    </VStack>
  )
}
