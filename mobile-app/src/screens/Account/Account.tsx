import React, { useEffect, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  View,
  VStack
} from 'native-base'

import { ButtonWithAlert } from '@components/ButtonWithAlert'

import { AccountStackScreenProps } from '@navigation/types'
import codePush, { LocalPackage } from 'react-native-code-push'
import DeviceInfo from 'react-native-device-info'
import { useDeviceStore } from '@src/utils/deviceStore'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { t, Trans } from '@lingui/macro'
import { useDeleteAccountMutation } from './Account.codegen'

const settingsOptions = [
  { name: t`Settings`, route: 'Settings' },
  { name: t`Change master password`, route: 'ChangeMasterPassword' }
]

const SettingsItem = ({
  name,
  onPress
}: {
  name: string
  onPress: () => void
}) => {
  return (
    <Button
      onPress={onPress}
      alignSelf="center"
      alignItems="center"
      _pressed={{
        opacity: 0.5
      }}
      justifyContent={'center'}
      w={'90%'}
      bgColor={useColorModeValue('#fff', 'rgb(18, 18, 18)')}
      rounded={8}
      borderWidth={1}
      borderColor={useColorModeValue('#cfcfcf', 'rgb(47, 47, 47)')}
    >
      <Text>
        <Trans>{name}</Trans>
      </Text>
    </Button>
  )
}

function Account({ navigation }: AccountStackScreenProps<'Account'>) {
  const [appMetadata, setAppMetadata] = useState<LocalPackage | null>(null)
  const device = useDeviceStore((state) => state)
  const deviceState = useDeviceStateStore((state) => state)
  const [deleteAccount] = useDeleteAccountMutation()

  useEffect(() => {
    codePush.getUpdateMetadata().then((metadata) => {
      setAppMetadata(metadata)
    })
  }, [])

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
        <Heading size="lg">{deviceState.email}</Heading>
      </VStack>

      <Divider />

      <VStack flex={1} space={5} mt={5}>
        {settingsOptions.map((i) => {
          return (
            <SettingsItem
              name={i.name}
              //@ts-expect-error
              onPress={() => navigation.navigate(i.route)}
              key={i.name}
            />
          )
        })}

        <ButtonWithAlert
          btnColor="primary"
          icon="lock-closed-outline"
          text={t`Do you want to lock device?`}
          onPress={() => device.lock()}
          btnText={t`Lock`}
        />

        <ButtonWithAlert
          btnText={t`Logout`}
          btnColor="orange"
          icon="log-out-outline"
          text={t`Do you want to logout?`}
          onPress={() => device.logout()}
        />
        <ButtonWithAlert
          btnText={t`Delete your account`}
          btnColor="danger"
          icon="log-out-outline"
          text={t`You cannot undo this action afterwards. Make sure to
              backup data that you want to keep.`}
          onPress={async () => {
            await deleteAccount()
            device.clearAndReload()
          }}
        />
      </VStack>
      <Center>
        <Flex
          height={'20%'}
          width={'90%'}
          flexDirection={'row'}
          justifyContent="space-between"
        >
          <Box>
            <Text>
              <Trans>Version</Trans>
            </Text>
            <Text>{DeviceInfo.getVersion()}</Text>
          </Box>
          <Box>
            <Text>
              <Trans>Codepush version</Trans>
            </Text>
            <Text>{appMetadata?.label || 'Native'}</Text>
          </Box>
        </Flex>
      </Center>
    </View>
  )
}

export default Account
