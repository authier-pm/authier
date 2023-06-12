import { Trans } from '@lingui/macro'
import { useNetInfo } from '@react-native-community/netinfo'
import { Flex, Text, WarningIcon } from 'native-base'

export const OfflineBanner = () => {
  const { isConnected } = useNetInfo()
  if (isConnected) {
    return null
  }
  return (
    <Flex
      flexDir="row"
      w="100%"
      justifyContent="center"
      p={1}
      alignItems="center"
      bgColor="red.400"
    >
      <WarningIcon size={18} color="#fff" />
      <Text color="white" ml={8} fontSize={14} lineHeight={22} fontWeight={500}>
        <Trans>Your device is offline</Trans>
      </Text>
    </Flex>
  )
}
