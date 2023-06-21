import React from 'react'

import {
  Center,
  Heading,
  HStack,
  Switch,
  Text,
  useColorModeValue,
  VStack,
  Input,
  Select,
  Divider,
  useColorMode,
  ScrollView
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
import AuthierSelect from '@src/components/AuthierSelect'
import { i18n } from '@lingui/core'

function UserSettings() {
  let deviceState = useDeviceStateStore((state) => state)
  let device = useDeviceStore((state) => state)
  const [deleteAccount] = useDeleteAccountMutation()
  const navigation =
    useNavigation<AccountStackScreenProps<'Account'>['navigation']>()
  const [isOpen, setIsOpen] = React.useState(
    !!deviceState.notificationOnWrongPasswordAttempts
  )
  const { toggleColorMode } = useColorMode()

  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  return (
    <ScrollView mt={5}>
      <Center>
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
          {/** **/}
          <Heading size="md">
            <Trans>New device default settings</Trans>
          </Heading>

          <VStack space={2} backgroundColor={itemBg} rounded="xl" p={3}>
            <AuthierSelect
              variant="rounded"
              onValueChange={(value) => {
                device.setLockTime(parseInt(value, 10))
              }}
              selectedValue={deviceState.vaultLockTimeoutSeconds.toString()}
              accessibilityLabel="Lock time"
            >
              <Select.Item label="1 minute" value="20" />
              <Select.Item label="2 minutes" value="120" />
              <Select.Item label="1 hour" value="3600" />
              <Select.Item label="4 hours" value="14400" />
              <Select.Item label="8 hours" value="28800" />
              <Select.Item label="1 week" value="604800" />
              <Select.Item label="1 month" value="2592000" />
              <Select.Item label="never" value="0" />
            </AuthierSelect>
            <Text>
              <Trans>
                Automatically locks vault after chosen period of time
              </Trans>
            </Text>

            <Divider />
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>2FA</Text>
              <Switch
                value={deviceState.syncTOTP}
                onToggle={async (e) => {
                  deviceState.changeSyncTOTP(e)
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>Credentials autofill</Text>
              <Switch
                value={deviceState.syncTOTP}
                onToggle={async (e) => {
                  deviceState.changeSyncTOTP(e)
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>TOTP autofill</Text>
              <Switch
                value={deviceState.syncTOTP}
                onToggle={async (e) => {
                  deviceState.changeSyncTOTP(e)
                }}
                size="md"
              />
            </HStack>
            <AuthierSelect
              onValueChange={(value) => {
                deviceState.changeUiLanguage(value)
                i18n.activate(value)
              }}
              defaultValue={deviceState.uiLanguage}
              accessibilityLabel="language"
            >
              <Select.Item label="English" value="en" />
              <Select.Item label="Čeština" value="cs" />
            </AuthierSelect>
            <AuthierSelect
              onValueChange={(value) => {
                toggleColorMode()
                deviceState.changeTheme(value)
              }}
              defaultValue={deviceState.theme}
              accessibilityLabel="theme"
            >
              <Select.Item label="light" value="light" />
              <Select.Item label="dark" value="dark" />
            </AuthierSelect>
          </VStack>
          {/** **/}
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
    </ScrollView>
  )
}

export default UserSettings
