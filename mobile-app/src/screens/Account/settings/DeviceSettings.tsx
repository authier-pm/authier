import React from 'react'
import {
  Box,
  Center,
  Select,
  Text,
  useColorModeValue,
  VStack,
  useColorMode,
  HStack,
  Switch,
  Divider,
  Heading,
  ScrollView
} from 'native-base'
import PasswordReEnter from '@src/components/PasswordReEnter'

import SInfo from 'react-native-sensitive-info'
import { Trans } from '@lingui/macro'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { SettingsInput } from '@shared/generated/graphqlBaseTypes'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'
import { i18n } from '@lingui/core'
import { RefreshControl } from 'react-native'

function DeviceSettings() {
  let deviceState = useDeviceStateStore((state) => state)
  let device = useDeviceStore((state) => state)
  const { toggleColorMode } = useColorMode()
  const [modalVisible, setModalVisible] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [updateSettings] = useUpdateSettingsMutation({})
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  const currentSettings = (): SettingsInput => {
    return {
      autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
      autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
      uiLanguage: deviceState.uiLanguage,
      syncTOTP: deviceState.syncTOTP,
      vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds,
      notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
      notificationOnWrongPasswordAttempts:
        deviceState.notificationOnWrongPasswordAttempts
    }
  }
  const [previousSettings, setPreviousSettings] = React.useState<SettingsInput>(
    currentSettings()
  )

  React.useEffect(() => {
    if (!previousSettings) {
      setPreviousSettings(currentSettings)
      return
    }

    const settingsChanged =
      JSON.stringify(previousSettings) !== JSON.stringify(currentSettings())

    //FIX: This is called  after onRefresh, which should not happen
    if (settingsChanged) {
      updateSettings({
        variables: {
          config: currentSettings()
        }
      })
    }

    setPreviousSettings(currentSettings)
  }, [deviceState, refreshing])

  const onRefresh = () => {
    setRefreshing(true)
    device.updateDeviceSettings()
    setRefreshing(false)
  }
  return (
    <ScrollView
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
      }
    >
      <Center mt={5} mb={5}>
        <VStack width="90%" space={4}>
          {/*  */}
          <VStack space={2}>
            <Heading size="md">
              <Trans>Security</Trans>
            </Heading>
            <VStack space={2} backgroundColor={itemBg} rounded="xl" p={3}>
              <VStack space={2}>
                <Text>
                  <Trans>Lock time</Trans>
                </Text>

                <Box p={2}>
                  <Select
                    //@ts-expect-error https://github.com/GeekyAnts/NativeBase/issues/5687
                    optimized={false}
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
                  </Select>

                  <Text>
                    <Trans>
                      Automatically locks vault after chosen period of time
                    </Trans>
                  </Text>
                </Box>
              </VStack>
              <Divider />
              <HStack
                justifyContent="space-between"
                alignContent="center"
                p={2}
              >
                <Text>2FA</Text>
                <Switch
                  value={deviceState.syncTOTP}
                  onToggle={async (e) => {
                    deviceState.changeSyncTOTP(e)
                  }}
                  size="md"
                />
              </HStack>
              <Divider />
              {/* //TODO: Dont change switch value right after click, not sure if native base even support this, maybe use checkbox instead */}
              <HStack justifyContent="space-between" p={2}>
                <Text>Biometrics</Text>
                <Switch
                  isDisabled={!device.biometricsAvailable}
                  isChecked={deviceState.biometricsEnabled}
                  size="md"
                  onToggle={async () => {
                    if (deviceState.biometricsEnabled) {
                      await SInfo.deleteItem('psw', {
                        sharedPreferencesName: 'authierShared',
                        keychainService: 'authierKCH'
                      })
                      deviceState.changeBiometricsEnabled(false)
                    } else {
                      setModalVisible(true)
                    }
                  }}
                />
              </HStack>
              <PasswordReEnter
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
              />
            </VStack>
          </VStack>

          {/*  */}
          <VStack space={2}>
            <Heading size="md">
              <Trans>Language</Trans>
            </Heading>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                //@ts-expect-error
                optimized={false}
                onValueChange={(value) => {
                  deviceState.changeUiLanguage(value)
                  i18n.activate(value)
                }}
                defaultValue={deviceState.uiLanguage}
                accessibilityLabel="language"
              >
                <Select.Item label="English" value="en" />
                <Select.Item label="Čeština" value="cs" />
              </Select>
            </Box>
          </VStack>
          {/*  */}
          <VStack space={2}>
            <Heading size="md">
              <Trans>Theme</Trans>
            </Heading>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                //@ts-expect-error
                optimized={false}
                onValueChange={(value) => {
                  toggleColorMode()
                  deviceState.changeTheme(value)
                }}
                defaultValue={deviceState.theme}
                accessibilityLabel="theme"
              >
                <Select.Item label="light" value="light" />
                <Select.Item label="dark" value="dark" />
              </Select>
            </Box>
          </VStack>
        </VStack>
      </Center>
    </ScrollView>
  )
}

export default DeviceSettings
