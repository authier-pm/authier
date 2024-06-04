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

export const SettingsItem = ({
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

export function Account({ navigation }: AccountStackScreenProps<'Account'>) {
  const [appMetadata, setAppMetadata] = useState<LocalPackage | null>(null)
  const device = useDeviceStore((state) => state)
  const deviceState = useDeviceStateStore((state) => state)

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
        backgroundColor={useColorModeValue('cyan.800', 'rgb(18, 18, 18)')}
      >
        <Avatar
          size={'lg'}
          source={{ uri: 'https://www.gravatar.com/avatar' }}
        />
        <Heading size="lg">{deviceState.email}</Heading>
      </VStack>

      <Divider />

      <VStack flex={1} space={5} mt={5}>
        <SettingsItem
          name={t`Settings`}
          onPress={() => navigation.navigate('Settings', { screen: 'User' })}
          key={'Settings'}
        />

        <SettingsItem
          name={t`Limits`}
          onPress={() => navigation.navigate('Limits')}
          key={'Limits'}
        />

        <ButtonWithAlert
          btnColor="primary"
          icon="lock-closed-outline"
          text={t`Do you want to lock device?`}
          onPress={async () => await device.lock()}
          btnText={t`Lock`}
        />

        <ButtonWithAlert
          btnText={t`Logout`}
          btnColor="danger"
          icon="log-out-outline"
          text={t`Do you want to logout?`}
          onPress={async () => await device.logout()}
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
