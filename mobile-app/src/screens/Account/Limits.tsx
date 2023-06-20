import {
  Center,
  HStack,
  Text,
  VStack,
  Divider,
  Avatar,
  Heading,
  useColorModeValue,
  View,
  Button
} from 'native-base'
import React from 'react'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useLimitsQuery } from '../../../../shared/graphql/AccountLimits.codegen'
import { Linking } from 'react-native'
import { PAGE_URL } from '@env'

export default function Limits() {
  const [token] = useDeviceStateStore((state) => [state.accessToken])
  const { data } = useLimitsQuery({
    fetchPolicy: 'network-only'
  })

  const [email] = useDeviceStateStore((state) => [state.email])
  return (
    <View>
      <VStack
        alignItems="center"
        space={5}
        pb={3}
        backgroundColor={useColorModeValue('white', 'rgb(18, 18, 18)')}
      >
        <Avatar
          size={'lg'}
          source={{ uri: 'https://www.gravatar.com/avatar' }}
        />
        <Heading size="lg">{email}</Heading>
      </VStack>

      <Divider />

      <Center pt={8}>
        <VStack space={4} divider={<Divider />} w="95%">
          <HStack justifyContent="space-around">
            <Text>Type</Text>
            <Text>Current count</Text>
            <Text>Your limit</Text>
          </HStack>
          <HStack justifyContent="space-around">
            <Text>Credentials</Text>
            <Text>
              {
                data?.me.encryptedSecrets.filter(
                  (i) => i.kind === 'LOGIN_CREDENTIALS'
                ).length
              }
            </Text>
            <Text>{data?.me.loginCredentialsLimit}</Text>
          </HStack>
          <HStack justifyContent="space-around">
            <Text>TOTP</Text>
            <Text>
              {
                data?.me.encryptedSecrets.filter((i) => i.kind === 'TOTP')
                  .length
              }
            </Text>
            <Text>{data?.me.TOTPlimit}</Text>
          </HStack>
        </VStack>
      </Center>

      <Button
        mt={10}
        mx={5}
        colorScheme="primary"
        onPress={() => {
          Linking.openURL(`${PAGE_URL}/pricing&acToken=${token}`)
        }}
      >
        Pricing page
      </Button>
    </View>
  )
}
