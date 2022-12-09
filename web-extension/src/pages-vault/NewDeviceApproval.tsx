import { Center, Button, Alert, VStack, Grid } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

import {
  useApproveChallengeMutation,
  useDevicesRequestsQuery,
  useMyDevicesQuery,
  useRejectChallengeMutation
} from '@shared/graphql/AccountDevices.codegen'
import { formatRelative } from 'date-fns'

export const NewDevicesApprovalStack = () => {
  const { refetch: devicesRefetch } = useMyDevicesQuery()

  const { data: devicesRequests } = useDevicesRequestsQuery()

  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()

  return (
    <VStack mt={3}>
      {devicesRequests?.me?.decryptionChallengesWaiting.map(
        (challengeToApprove) => {
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
              <Center>
                New Device trying to login{' '}
                {formatRelative(
                  new Date(challengeToApprove.createdAt),
                  new Date()
                )}
                : from IP {challengeToApprove.ipAddress} (
                {challengeToApprove.ipGeoLocation.city},{' '}
                {challengeToApprove.ipGeoLocation.country_name})
              </Center>

              <Grid
                gridGap={1}
                autoFlow="row"
                templateColumns="repeat(auto-fit, 49%)"
              >
                <Center>
                  <Button
                    w="50%"
                    colorScheme="red"
                    onClick={async () => {
                      await reject({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      devicesRefetch()
                    }}
                  >
                    <Trans>Reject</Trans>
                  </Button>
                </Center>
                <Center>
                  <Button
                    w="50%"
                    colorScheme="green"
                    onClick={async () => {
                      await approve({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      devicesRefetch()
                    }}
                  >
                    <Trans>Approve</Trans>
                  </Button>
                </Center>
              </Grid>
            </Alert>
          )
        }
      )}
    </VStack>
  )
}
