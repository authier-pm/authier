import React, { useEffect, useState } from 'react'
import {
  FlatList,
  Icon,
  Heading,
  Text,
  View,
  HStack,
  VStack,
  Pressable,
  Badge,
  Button,
  Alert,
  Box,
  useColorModeValue
} from 'native-base'

import Ionicons from 'react-native-vector-icons/Ionicons'

import { SearchBar } from '@components/SearchBar'
import {
  useApproveChallengeMutation,
  useDevicesListQuery,
  useDevicesRequestsQuery,
  useRejectChallengeMutation
} from '@shared/graphql/AccountDevices.codegen'
import {
  DecryptionChallengeForApproval,
  DeviceQuery,
  UserQuery
} from '@shared/generated/graphqlBaseTypes'
import { formatRelative } from 'date-fns'
import { Trans } from '@lingui/macro'
import { DevicesStackScreenProps } from '@navigation/types'
import { useDeviceStateStore } from '@utils/deviceStateStore'

import mitt from 'mitt'
import { useDeviceStore } from '@src/utils/deviceStore'

export const icons = {
  Android: 'logo-android',
  iOS: 'logo-apple',
  Windows: 'logo-windows',
  Linux: 'logo-tux',
  MacOS: 'logo-apple',
  Firefox: 'logo-firefox',
  ChromeOS: 'logo-chrome'
}
export let emitter = mitt()
const empty = () => {
  return <></>
}
function DeviceList({ navigation }: DevicesStackScreenProps<'DeviceList'>) {
  const [id] = useDeviceStore((state) => [state.id])
  const [notifications, setNotifications] = useDeviceStateStore((state) => [
    state.notifications,
    state.setNotifications
  ])
  const [filterBy, setFilterBy] = useState('')
  const {
    data: devicesData,
    loading: devicesLoading,
    refetch: devicesRefetch,
    startPolling: devicesStartPolling,
    stopPolling: devicesStopPolling,
    previousData
  } = useDevicesListQuery()
  const {
    data: dataRequests,
    refetch: requestsRefetch,
    loading: loadingRequests
  } = useDevicesRequestsQuery({})
  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()

  const bgColor = useColorModeValue('white', 'rgb(18, 18, 18)')

  useEffect(() => {
    //FIX: this is calling on every rerender
    if (previousData !== null && previousData !== devicesData) {
      devicesStopPolling()
    }
    emitter.on('refresh', () => {
      devicesRefetch()
    })
    return () => {
      emitter.off('refresh')
    }
  }, [devicesData, previousData])

  const renderDevice = ({
    device,
    masterDeviceId
  }: {
    device: Partial<DeviceQuery>
    masterDeviceId: UserQuery['masterDeviceId']
  }) => {
    return (
      <Pressable
        key={device.id}
        onPress={() => {
          navigation.navigate('DeviceInfo', {
            deviceId: device.id as string,
            masterDeviceId
          })
        }}
        borderWidth={1}
        borderColor={'gray.600'}
        m={2}
        rounded={'lg'}
        p={3}
        bgColor={bgColor}
      >
        {({ isPressed }) => {
          return (
            <HStack
              style={{
                transform: [
                  {
                    scale: isPressed ? 0.96 : 1
                  }
                ]
              }}
            >
              <HStack space={5} alignItems="center">
                {Object.keys(icons).map((i, el) => {
                  if (
                    i
                      .toLowerCase()
                      .includes(device.platform?.toLowerCase() ?? '')
                  ) {
                    return (
                      <Icon
                        key={el}
                        ml="2"
                        size="50"
                        color="gray.500"
                        as={<Ionicons name={icons[i]} />}
                      />
                    )
                  }
                })}

                <VStack space={3}>
                  <HStack space={3}>
                    {device.logoutAt ? (
                      <Badge colorScheme="red">LOGGED OUT</Badge>
                    ) : (
                      <Badge colorScheme="success">LOGGED IN</Badge>
                    )}
                    {device.id === masterDeviceId ? (
                      <Badge colorScheme="yellow">MASTER</Badge>
                    ) : null}
                    {device.id === id ? (
                      <Badge colorScheme="orange">CURRENT</Badge>
                    ) : null}
                  </HStack>

                  <VStack space={1}>
                    <Heading size={'md'}>{device.name}</Heading>
                    <Text>{device.lastIpAddress}</Text>
                    <HStack alignItems="center" space={2}>
                      <Ionicons
                        name="location-outline"
                        color={'#00a8ff'}
                        size={20}
                      />
                      <Text>{device.lastGeoLocation}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </HStack>
            </HStack>
          )
        }}
      </Pressable>
    )
  }

  const renderRequest = ({
    item
  }: {
    item: DecryptionChallengeForApproval
  }) => {
    const fromLocationText = item.ipGeoLocation
      ? `(${item.ipGeoLocation?.city}, ${item.ipGeoLocation?.country_name})`
      : ''
    return (
      <Box minH="290px">
        <Alert
          status="info"
          key={item.id}
          mx={3}
          borderWidth={1}
          borderColor={'gray.400'}
          m={2}
          rounded={'lg'}
          p={3}
        >
          <VStack flexShrink={1} w="100%">
            <HStack
              flexShrink={1}
              space={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack space={2} flexShrink={1} alignItems="center">
                <Alert.Icon />
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  _dark={{
                    color: 'coolGray.800'
                  }}
                >
                  <Trans>New Device is trying to login!</Trans>
                </Text>
              </HStack>
            </HStack>
            <Box
              pl="6"
              _dark={{
                _text: {
                  color: 'coolGray.600'
                }
              }}
            >
              <Text w="100%" color={'orange.600'} fontSize="sm">
                {item.deviceName}{' '}
                {formatRelative(new Date(item.createdAt), new Date())} from IP{' '}
                {item.ipAddress} {fromLocationText}
              </Text>
            </Box>
          </VStack>

          <HStack space={6} mt={3}>
            <Button
              w={'30%'}
              size={'lg'}
              rounded={'xl'}
              colorScheme="green"
              variant="solid"
              onPress={async () => {
                await approve({
                  variables: {
                    id: item.id
                  }
                })
                requestsRefetch()
                devicesStartPolling(5000)
                setNotifications(notifications - 1)
                //TODO: Add here some kind of animations, like a spinner to show that the device is being added
              }}
            >
              <Text fontWeight="bold" color="white">
                <Trans>Approve</Trans>
              </Text>
            </Button>
            <Button
              w={'30%'}
              rounded={'xl'}
              colorScheme="red"
              onPress={async () => {
                await reject({
                  variables: {
                    id: item.id
                  }
                })
                requestsRefetch()
              }}
            >
              <Text fontWeight="bold" color="white">
                <Trans>Reject</Trans>
              </Text>
            </Button>
          </HStack>
        </Alert>
      </Box>
    )
  }
  return (
    <View>
      <HStack flexDirection="row" alignItems="center" space={4} m={4}>
        <SearchBar setFilterBy={setFilterBy} />
      </HStack>
      {/* List of requests*/}
      <FlatList
        flexGrow={0}
        ListEmptyComponent={empty}
        data={dataRequests?.me?.decryptionChallengesWaiting}
        keyExtractor={(item) => {
          return item.id.toString()
        }}
        renderItem={({ item }) => renderRequest({ item })}
        onRefresh={requestsRefetch}
        refreshing={loadingRequests}
      />

      {/* List of devices */}
      <FlatList
        onRefresh={() => {
          devicesRefetch()
          requestsRefetch()
        }}
        refreshing={devicesLoading}
        data={devicesData?.me?.devices.filter(({ name }) =>
          name.toLocaleLowerCase().includes(filterBy.toLocaleLowerCase())
        )}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) =>
          renderDevice({
            device: item,
            masterDeviceId: devicesData?.me?.masterDeviceId
          })
        }
      />
    </View>
  )
}

export default DeviceList
