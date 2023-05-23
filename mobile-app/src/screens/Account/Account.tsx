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

import { ButtonWithAlert } from '../../components/ButtonWithAlert'

import { AccountStackScreenProps } from '../../navigation/types'
import codePush, { LocalPackage } from 'react-native-code-push'
import DeviceInfo from 'react-native-device-info'
import { useStore } from '@src/utils/deviceStore'
import { useTestStore } from '@src/utils/deviceStateStore'

const settingsOptions = [
  { name: 'Settings', route: 'Settings' },
  { name: 'Import passwords', route: 'ImportPasswords' },
  { name: 'Change master password', route: 'ChangeMasterPassword' }
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
      <Text>{name}</Text>
    </Button>
  )
}

function Account({ navigation }: AccountStackScreenProps<'Account'>) {
  const [appMetadata, setAppMetadata] = useState<LocalPackage | null>(null)
  const device = useStore((state) => state)
  const deviceState = useTestStore((state) => state)

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
          btnColor="orange"
          icon="lock-closed-outline"
          text={'Do you want to lock device?'}
          onPress={() => device.lock()}
          btnText="Lock"
        />

        <ButtonWithAlert
          btnText="Logout"
          btnColor="danger"
          icon="log-out-outline"
          text={'Do you want to logout?'}
          onPress={() => device.logout()}
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
            <Text>Version</Text>
            <Text>{DeviceInfo.getVersion()}</Text>
          </Box>
          <Box>
            <Text>Codepush version</Text>
            <Text>{appMetadata?.label || 'Native'}</Text>
          </Box>
        </Flex>
      </Center>
    </View>
  )
}

export default Account
