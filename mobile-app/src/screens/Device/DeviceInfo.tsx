import { t, Trans } from '@lingui/macro'

import { intlFormat } from 'date-fns'
import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Icon,
  ScrollView,
  Select,
  Switch,
  Text,
  useColorModeValue,
  View,
  VStack
} from 'native-base'
import React, { ReactElement } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LogoutDeviceAlert } from '@components/LogoutDeviceAlert'

import { DevicesStackScreenProps } from '@navigation/types'
import { useDeviceStateStore } from '@utils/deviceStateStore'
import { useChangeMasterDeviceMutation } from '@shared/graphql/AccountDevices.codegen'
import { icons } from './Devices'

import { useDeviceStore } from '@src/utils/deviceStore'

const ColumnWrapper = ({
  text,
  children
}: {
  text: string
  children: ReactElement
}) => {
  return (
    <HStack alignItems={'center'} justifyContent="space-between">
      <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
        {text}
      </Text>
      {children}
    </HStack>
  )
}

export default function DeviceInfo({
  route,
  navigation
}: DevicesStackScreenProps<'DeviceInfo'>) {
  const [id, setLockTime] = useDeviceStore((state) => [
    state.id,
    state.setLockTime
  ])
  const [changeMasterDevice] = useChangeMasterDeviceMutation()
  const masterDeviceId = route.params.masterDeviceId
  const selectedDeviceId = route.params.device.id
  const currentDeviceId = id
  const currentDevice = route.params.device
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  console.log(route.params.device)
  return (
    <ScrollView p={5}>
      <VStack space={8}>
        <VStack space={4}>
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
            <LogoutDeviceAlert
              selectedDeviceId={selectedDeviceId ?? ''}
              masterDeviceId={masterDeviceId ?? ''}
            />
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
                    color="yellow.400"
                  />
                }
              >
                <Text color="white" fontWeight={'bold'}>
                  <Trans>Set on master device</Trans>
                </Text>
              </Button>
            ) : null}
          </HStack>

          <VStack>
            <Heading fontWeight={'bold'} color={'gray.500'} size="md" m={3}>
              <Trans>About</Trans>
            </Heading>
            <VStack backgroundColor={itemBg} p={3} rounded={10} space={4}>
              <ColumnWrapper text={t`Last IP Address`}>
                <Text fontSize={'xl'}>
                  {route.params.device.firstIpAddress}
                </Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Geolocation`}>
                <Text fontSize={'xl'}>
                  {route.params.device.lastGeoLocation}
                </Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Platform`}>
                <Text fontSize={'xl'}>{route.params.device.platform}</Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Logout at`}>
                <Text fontSize={'xl'}>
                  {route.params.device.logoutAt ?? 'Logged in'}
                </Text>
              </ColumnWrapper>

              <HStack alignItems={'center'} justifyContent="space-between">
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  <Trans>Created</Trans>
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
      </VStack>

      {selectedDeviceId !== masterDeviceId ? (
        <VStack mb={10}>
          <Heading fontWeight={'bold'} color={'gray.500'} size="md" m={3}>
            <Trans>Settings</Trans>
          </Heading>
          <VStack backgroundColor={itemBg} p={3} rounded={10} space={2}>
            <Text>
              <Trans>Lock time</Trans>
            </Text>

            <Box p={2}>
              <Select
                variant="rounded"
                onValueChange={(value) => {
                  console.log('update value on backend')
                }}
                defaultValue={currentDevice.vaultLockTimeoutSeconds?.toString()}
                accessibilityLabel="Lock time"
              >
                <Select.Item label="1 minute" value="20" />
                <Select.Item label="2 minutes" value="120" />
                <Select.Item label="1 hour" value="3600" />
                <Select.Item label="4 hours" value="14400" />
                <Select.Item label="8 hours" value="28800" />
                <Select.Item label="never" value="0" />
              </Select>

              <Text>
                <Trans>
                  Automatically locks vault after chosen period of time
                </Trans>
              </Text>
            </Box>
            <Divider />
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>2FA</Text>
              <Switch
                value={currentDevice.syncTOTP}
                onToggle={async (e) => {
                  console.log('Update on backend')
                }}
                size="md"
              />
            </HStack>
          </VStack>
        </VStack>
      ) : null}
    </ScrollView>
  )
}
