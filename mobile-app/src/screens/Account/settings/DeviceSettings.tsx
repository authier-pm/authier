import React, { useEffect, useState } from 'react'
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
import { PasswordReEnter } from '@src/components/PasswordReEnter'

import SInfo from 'react-native-sensitive-info'
import { Trans } from '@lingui/macro'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { SettingsInput } from '@shared/generated/graphqlBaseTypes'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'

import { RefreshControl } from 'react-native'
import { AuthierSelect } from '@src/components/AuthierSelect'
import { vaultLockTimeoutOptions } from '@shared/constants'

export function DeviceSettings() {
  const deviceState = useDeviceStateStore((state) => state)
  const device = useDeviceStore((state) => state)
  const { toggleColorMode } = useColorMode()
  const [modalVisible, setModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updateSettings] = useUpdateSettingsMutation({})
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  const currentSettings = (): SettingsInput => {
    return {
      autofillTOTPEnabled: deviceState.autofillTOTPEnabled as boolean,
      autofillCredentialsEnabled:
        deviceState.autofillCredentialsEnabled as boolean,
      uiLanguage: deviceState.uiLanguage as string,
      syncTOTP: deviceState.syncTOTP as boolean,
      vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds as number,
      notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
      notificationOnWrongPasswordAttempts:
        deviceState.notificationOnWrongPasswordAttempts
    }
  }
  const [previousSettings, setPreviousSettings] = useState<SettingsInput>(
    currentSettings()
  )

  useEffect(() => {
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
                <Trans>Lock time</Trans>

                <Box p={2}>
                  <AuthierSelect
                    variant="rounded"
                    onValueChange={(value) => {
                      device.setLockTime(parseInt(value, 10))
                    }}
                    selectedValue={
                      deviceState.vaultLockTimeoutSeconds?.toString() ?? '0'
                    }
                    accessibilityLabel="Lock time"
                  >
                    {vaultLockTimeoutOptions.map((option, index) => (
                      <Select.Item
                        label={option.label}
                        value={option.value.toString()}
                        key={index}
                      />
                    ))}
                  </AuthierSelect>

                  <Trans>
                    Automatically locks vault after chosen period of time
                  </Trans>
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
                  value={deviceState.syncTOTP ?? false}
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
              <Trans>Theme</Trans>
            </Heading>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <AuthierSelect
                onValueChange={(value) => {
                  toggleColorMode()
                  deviceState.changeTheme(value)
                }}
                selectedValue={deviceState.theme}
                accessibilityLabel="theme"
              >
                <Select.Item label="Light" value="light" />
                <Select.Item label="Dark" value="dark" />
              </AuthierSelect>
            </Box>
          </VStack>
        </VStack>
      </Center>
    </ScrollView>
  )
}
