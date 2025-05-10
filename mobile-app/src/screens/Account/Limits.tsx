import {
  Avatar,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  HStack,
  ScrollView,
  Text,
  useColorModeValue,
  VStack
} from 'native-base'
import React, { useCallback } from 'react'
import { Alert, Linking, RefreshControl } from 'react-native'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { useDeviceStateStore } from '../../utils/deviceStateStore'

const PAGE_URL = process.env.EXPO_PUBLIC_PAGE_URL

type OpenURLButtonProps = {
  url: string
  children: string
}

const OpenURLButton = ({ url, children }: OpenURLButtonProps) => {
  const handlePress = useCallback(async () => {
    // Checking if the link is supported for links with custom URL scheme.
    // FIX: does not work on android
    // const supported = await Linking.canOpenURL(url)

    if (!url.startsWith('http') && !url.startsWith('https')) {
      Alert.alert('Invalid URL', 'URL must start with "http" or "https"')
      return
    }

    await Linking.openURL(url)
  }, [url])

  return (
    <Button mt={10} mx={5} onPress={handlePress} colorScheme="primary">
      {children}
    </Button>
  )
}

export function Limits() {
  const [token, email] = useDeviceStateStore((state) => [
    state.accessToken,
    state.email
  ])
  const { data, refetch, loading } = useLimitsQuery({
    fetchPolicy: 'cache-and-network'
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
        backgroundColor={useColorModeValue('cyan.800', 'rgb(18, 18, 18)')}
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

      <OpenURLButton url={`${PAGE_URL}/pricing?acToken=${token}`}>
        Pricing page
      </OpenURLButton>
    </ScrollView>
  )
}
