import React from 'react'

import {
  Box,
  Center,
  Select,
  Text,
  useColorModeValue,
  View,
  VStack,
  useColorMode
} from 'native-base'

import { Trans } from '@lingui/macro'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { SettingsInput } from '@shared/generated/graphqlBaseTypes'
import { SyncSettingsDocument } from '@shared/graphql/Settings.codegen'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { i18n } from '@lingui/core'

function DeviceSettings() {
  let deviceState = useDeviceStateStore((state) => state)

  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }],
    awaitRefetchQueries: true
  })
  const { toggleColorMode } = useColorMode()
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  const settings = (): SettingsInput => {
    return {
      autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
      autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
      uiLanguage: deviceState.uiLanguage,
      syncTOTP: deviceState.syncTOTP,
      vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds
    }
  }

  return (
    <View>
      <Center mt={5}>
        <VStack width="90%" space={4}>
          {/*  */}
          <VStack space={2}>
            <Text>
              <Trans>Language</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                onValueChange={(value) => {
                  deviceState.changeUiLanguage(value)
                  updateSettings({
                    variables: {
                      config: settings()
                    }
                  })
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
            <Text>
              <Trans>Theme</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                onValueChange={(value) => {
                  toggleColorMode()
                  deviceState.changeTheme(value)
                  console.log(value)
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
    </View>
  )
}

export default DeviceSettings
