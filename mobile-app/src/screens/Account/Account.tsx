import React from 'react'

import {
  Avatar,
  Button,
  Divider,
  Heading,
  Text,
  useColorModeValue,
  View,
  VStack
} from 'native-base'
import { ButtonWithAlert } from '../../components/ButtonWithAlert'
import { device } from '../../utils/Device'
import { AccountStackScreenProps } from '../../navigation/types'

const settingsOptions = [
  { name: 'Settings', route: 'Settings' },
  { name: 'Import passwords', route: 'ImportPasswords' }
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
        <Heading size="lg">{device.state?.email}</Heading>
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
    </View>
  )
}

export default Account
