import {
  Center,
  HStack,
  Text,
  VStack,
  Divider,
  Avatar,
  Heading,
  useColorModeValue,
  Button,
  ScrollView,
  Flex
} from 'native-base'
import React from 'react'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useLimitsQuery } from '../../../../shared/graphql/AccountLimits.codegen'
import { Linking, RefreshControl } from 'react-native'
import { PAGE_URL } from '@env'

export default function Limits() {
  const [token, email] = useDeviceStateStore((state) => [
    state.accessToken,
    state.email
  ])
  const { data, refetch, loading } = useLimitsQuery({
    fetchPolicy: 'network-only'
  })

  return (
    <ScrollView
      flex={1}
      refreshControl={
        <RefreshControl onRefresh={refetch} refreshing={loading} />
      }
    >
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
          <Flex mx={4} justifyContent="space-between" flexDir="row">
            <Text flex={3}>Credentials</Text>
            <Text flex={2}>
              {
                data?.me.encryptedSecrets.filter(
                  (i) => i.kind === 'LOGIN_CREDENTIALS'
                ).length
              }
            </Text>
            <Text flex={1}>{data?.me.loginCredentialsLimit}</Text>
          </Flex>
          <Flex mx={4} justifyContent="space-between" flexDir="row">
            <Text flex={3}>TOTP</Text>
            <Text flex={2}>
              {
                data?.me.encryptedSecrets.filter((i) => i.kind === 'TOTP')
                  .length
              }
            </Text>
            <Text flex={1}>{data?.me.TOTPlimit}</Text>
          </Flex>
        </VStack>
      </Center>

      <Button
        mt={10}
        mx={5}
        colorScheme="primary"
        onPress={() => {
          Linking.openURL(`${PAGE_URL}/pricing?acToken=${token}`)
        }}
      >
        Pricing page
      </Button>
    </ScrollView>
  )
}
