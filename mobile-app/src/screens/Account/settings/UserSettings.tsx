import React from 'react'

import {
  Center,
  Heading,
  HStack,
  Switch,
  Text,
  useColorModeValue,
  VStack,
  Input
} from 'native-base'

import { t, Trans } from '@lingui/macro'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'
import { ButtonWithAlert } from '@src/components/ButtonWithAlert'
import { useDeleteAccountMutation } from '../Account.codegen'
import { SettingsItem } from '../Account'
import { useNavigation } from '@react-navigation/native'
import { AccountStackScreenProps } from '@src/navigation/types'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'

function UserSettings() {
  let deviceState = useDeviceStateStore((state) => state)
  let device = useDeviceStore((state) => state)
  const [deleteAccount] = useDeleteAccountMutation()
  const navigation =
    useNavigation<AccountStackScreenProps<'Account'>['navigation']>()
  const [isOpen, setIsOpen] = React.useState(
    !!deviceState.notificationOnWrongPasswordAttempts
  )

  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  return (
    <Center mt={5}>
      <VStack width="90%" space={4}>
        <Heading size="md">
          <Trans>Notifications</Trans>
        </Heading>
        <VStack space={2} backgroundColor={itemBg} rounded="xl" p={3}>
          <HStack justifyContent="space-between" alignContent="center" p={2}>
            <Text alignSelf="center" fontSize="md">
              <Trans>Notify after password attempts</Trans>
            </Text>
            <Switch
              value={!!deviceState.notificationOnWrongPasswordAttempts}
              onToggle={(e) => {
                setIsOpen(!isOpen)
                if (e) {
                  deviceState.changeNotificationOnWrongPasswordAttempts(3)
                } else {
                  deviceState.changeNotificationOnWrongPasswordAttempts(0)
                }
              }}
              size="md"
            />
          </HStack>
          {isOpen ? (
            <Animated.View
              entering={FadeInUp}
              exiting={FadeOutUp}
              style={{
                display: 'flex',
                flexDirection: 'row',
                padding: 10,
                alignItems: 'center',
                borderRadius: 8
              }}
            >
              <Text fontSize="md" mr="5">
                <Trans>Attempts before notification:</Trans>
              </Text>
              <Input
                value={deviceState.notificationOnWrongPasswordAttempts.toString()}
                //WARNING: Not sure if is good idea to update on every text change, it could DDOS our API?
                onChangeText={(e) => {
                  if (e === '')
                    return deviceState.changeNotificationOnWrongPasswordAttempts(
                      0
                    )
                  deviceState.changeNotificationOnWrongPasswordAttempts(
                    parseInt(e)
                  )
                }}
                w="20%"
                fontSize="md"
                defaultValue="3"
              />
            </Animated.View>
          ) : null}
          <HStack justifyContent="space-between" alignContent="center" p={2}>
            <Text fontSize="md">On vault unlock</Text>
            <Switch
              value={deviceState.notificationOnVaultUnlock}
              onToggle={(e) => {
                deviceState.changeNotificationOnVaultUnlock(e)
              }}
              size="md"
            />
          </HStack>
        </VStack>
        <Heading size="md">
          <Trans>Danger zone</Trans>
        </Heading>
        <SettingsItem
          name={t`Change master password`}
          onPress={() => navigation.navigate('ChangeMasterPassword')}
          key={'ChangeMasterPassword'}
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
    </Center>
  )
}

export default UserSettings
