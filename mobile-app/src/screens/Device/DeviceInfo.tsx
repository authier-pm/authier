import { Trans } from '@lingui/macro'

import { intlFormat } from 'date-fns'
import {
  Button,
  Heading,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  View,
  VStack
} from 'native-base'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LogoutDeviceAlert } from '@components/LogoutDeviceAlert'

import { DevicesStackScreenProps } from '../../navigation/types'
import { DeviceContext } from '../../providers/DeviceProvider'
import { useChangeMasterDeviceMutation } from '@shared/graphql/AccountDevices.codegen'
import { icons } from './Devices'

export default function DeviceInfo({
  route,
  navigation
}: DevicesStackScreenProps<'DeviceInfo'>) {
  const device = React.useContext(DeviceContext)
  const [changeMasterDevice] = useChangeMasterDeviceMutation()
  const masterDeviceId = route.params.masterDeviceId
  const selectedDeviceId = route.params.device.id
  const currentDeviceId = device.id
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  return (
    <View p={5}>
      <VStack space={8}>
        <VStack space={8}>
          <HStack justifyContent="space-between">
            <Heading fontSize={'2xl'}>{route.params.device.name}</Heading>
            {Object.keys(icons).map((i, el) => {
              if (
                i
                  .toLowerCase()
                  .includes(route.params.device.platform?.toLowerCase() ?? '')
              ) {
                return (
                  <Icon
                    key={el}
                    size="50"
                    color="gray.500"
                    as={<Ionicons name={icons[i]} />}
                  />
                )
              }
            })}
          </HStack>

          <HStack justifyContent={'flex-start'} space={5}>
            <LogoutDeviceAlert id={route.params.device.id ?? ''} />
            {masterDeviceId !== selectedDeviceId &&
            currentDeviceId === masterDeviceId ? (
              <Button
                colorScheme="warning"
                rounded={15}
                onPress={() => {
                  changeMasterDevice({
                    variables: {
                      newMasterDeviceId: selectedDeviceId as string
                    }
                  })
                  navigation.goBack()
                }}
                leftIcon={
                  <Icon
                    alignSelf={'center'}
                    as={Ionicons}
                    name="star"
                    size={'md'}
                    color="black"
                  />
                }
              >
                <Text color="white" fontWeight={'bold'}>
                  <Trans>Set on master device</Trans>
                </Text>
              </Button>
            ) : null}
          </HStack>

          <VStack backgroundColor={itemBg} p={3} rounded={10} space={4}>
            <HStack alignItems={'center'} justifyContent="space-between">
              <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                Last IP Address
              </Text>
              <Text fontSize={'xl'}>{route.params.device.firstIpAddress}</Text>
            </HStack>

            <HStack alignItems={'center'} justifyContent="space-between">
              <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                Geolocation
              </Text>
              <Text fontSize={'xl'}>{route.params.device.lastGeoLocation}</Text>
            </HStack>

            <HStack alignItems={'center'} justifyContent="space-between">
              <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                Platform
              </Text>
              <Text fontSize={'xl'}>{route.params.device.platform}</Text>
            </HStack>

            <HStack alignItems={'center'} justifyContent="space-between">
              <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                Logout at
              </Text>
              <Text fontSize={'xl'}>
                {route.params.device.logoutAt ?? 'Logged in'}
              </Text>
            </HStack>

            <HStack alignItems={'center'} justifyContent="space-between">
              <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                Created
              </Text>
              <Text fontSize={'xl'}>
                {intlFormat(new Date(route.params.device.createdAt ?? ''), {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </View>
  )
}
