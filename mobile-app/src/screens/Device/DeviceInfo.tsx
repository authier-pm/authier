import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

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
  VStack
} from 'native-base'
import React, { ReactElement } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LogoutDeviceAlert } from '../../components/LogoutDeviceAlert'

import { DevicesStackScreenProps } from '../../navigation/types'
import {
  useChangeDeviceSettingsMutation,
  useChangeMasterDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import { icons } from './Devices'

import { useDeviceStore } from '../../utils/deviceStore'
import { Loading } from '../../components/Loading'
import { DeviceInfoDocument, useDeviceInfoQuery } from './DeviceInfo.codegen'
import { useVaultLockTimeoutOptions } from '../../utils/useVaultLockTimeoutOptions'

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

export function DeviceInfo({
  route,
  navigation
}: DevicesStackScreenProps<'DeviceInfo'>) {
  const { deviceId: selectedDeviceId, masterDeviceId } = route.params
  const [id] = useDeviceStore((state) => [state.id])
  const [changeMasterDevice] = useChangeMasterDeviceMutation()
  const [changeDeviceSettings, { loading: changeSettingsLoading }] =
    useChangeDeviceSettingsMutation({
      refetchQueries: [
        { query: DeviceInfoDocument, variables: { id: selectedDeviceId } }
      ],
      awaitRefetchQueries: true
    })
  const options = useVaultLockTimeoutOptions()
  const { data, loading, error } = useDeviceInfoQuery({
    variables: {
      id: selectedDeviceId
    },
    fetchPolicy: 'cache-and-network'
  })
  const currentDeviceId = id
  const selectedDeviceData = data?.me.device
  const itemBg = useColorModeValue('cyan.800', 'rgb(28, 28, 28)')

  if (loading && !error) return <Loading />

  return (
    <ScrollView p={5}>
      <VStack space={8}>
        <VStack space={4}>
          <HStack justifyContent="space-between">
            <Heading fontSize={'2xl'}>{selectedDeviceData?.name}</Heading>
            {Object.keys(icons).map((i, el) => {
              if (
                i
                  .toLowerCase()
                  .includes(selectedDeviceData?.platform?.toLowerCase() ?? '')
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
                  <Trans>Set as master device</Trans>
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
                  {selectedDeviceData?.firstIpAddress}
                </Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Geolocation`}>
                <Text fontSize={'xl'}>
                  {selectedDeviceData?.lastGeoLocation}
                </Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Platform`}>
                <Text fontSize={'xl'}>{selectedDeviceData?.platform}</Text>
              </ColumnWrapper>

              <ColumnWrapper text={t`Logout at`}>
                <Text fontSize={'xl'}>
                  {selectedDeviceData?.logoutAt ?? 'Logged in'}
                </Text>
              </ColumnWrapper>

              <HStack alignItems={'center'} justifyContent="space-between">
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  <Trans>Created</Trans>
                </Text>
                <Text fontSize={'xl'}>
                  {intlFormat(new Date(selectedDeviceData?.createdAt ?? ''), {
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

      {selectedDeviceId !== id ? (
        <VStack mb={10}>
          <Heading fontWeight={'bold'} color={'gray.500'} size="md" m={3}>
            <Trans>Settings</Trans>
          </Heading>
          <VStack backgroundColor={itemBg} p={3} rounded={10} space={2}>
            <Trans>Lock time</Trans>

            <Box p={2}>
              <Select
                variant="rounded"
                onValueChange={(value) => {
                  changeDeviceSettings({
                    variables: {
                      id: selectedDeviceId as string,
                      vaultLockTimeoutSeconds: parseInt(value),
                      syncTOTP: selectedDeviceData?.syncTOTP as boolean
                    }
                  })
                }}
                selectedValue={selectedDeviceData?.vaultLockTimeoutSeconds?.toString()}
                accessibilityLabel="Lock time"
              >
                {options.map((option, index) => (
                  <Select.Item
                    label={option.label}
                    value={option.value.toString()}
                    key={index}
                  />
                ))}
              </Select>

              <Trans>
                Automatically locks vault after chosen period of time
              </Trans>
            </Box>
            <Divider />
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Trans>2FA</Trans>
              <Switch
                //FIX: Flickers after change of Lock time
                value={
                  changeSettingsLoading
                    ? !selectedDeviceData?.syncTOTP
                    : selectedDeviceData?.syncTOTP
                }
                onToggle={async (e) => {
                  changeDeviceSettings({
                    variables: {
                      id: selectedDeviceId as string,
                      vaultLockTimeoutSeconds:
                        selectedDeviceData?.vaultLockTimeoutSeconds as number,
                      syncTOTP: e
                    }
                  })
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
