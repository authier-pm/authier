import React, { useContext } from 'react'

import {
  Box,
  Center,
  Select,
  Text,
  useColorModeValue,
  View,
  VStack,
  Switch,
  HStack,
  Divider,
  useColorMode
} from 'native-base'

import { Trans } from '@lingui/macro'
import { DeviceContext } from '../../providers/DeviceProvider'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { SettingsInput } from '@shared/generated/graphqlBaseTypes'
import { SyncSettingsDocument } from '@shared/graphql/Settings.codegen'

export default function Settings() {
  let device = useContext(DeviceContext)
  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }],
    awaitRefetchQueries: true
  })
  const { toggleColorMode } = useColorMode()
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  const settings = (): SettingsInput => {
    return {
      autofillTOTPEnabled: device.state!.autofillTOTPEnabled,
      autofillCredentialsEnabled: device.state!.autofillCredentialsEnabled,
      uiLanguage: device.state!.uiLanguage,
      syncTOTP: device.state!.syncTOTP,
      vaultLockTimeoutSeconds: device.state!.lockTime
    }
  }

  return (
    <View>
      <Center mt={5}>
        <VStack width="90%" space={4}>
          {/*  */}

          <VStack space={2}>
            <Text>
              <Trans>Lock time</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                variant="rounded"
                onValueChange={(value) => {
                  device.setLockTime(parseInt(value, 10))
                  updateSettings({
                    variables: {
                      config: settings()
                    }
                  })
                }}
                defaultValue={device.state!.lockTime.toString()}
                accessibilityLabel="Lock time"
              >
                <Select.Item label="1 minute" value="20" />
                <Select.Item label="2 minutes" value="120" />
                <Select.Item label="1 hour" value="3600" />
                <Select.Item label="4 hours" value="14400" />
                <Select.Item label="8 hours" value="28800" />
                <Select.Item label="never" value="0" />
              </Select>

              <Text>
                <Trans>
                  Automatically locks vault after chosen period of time
                </Trans>
              </Text>
            </Box>
          </VStack>

          {/*  */}

          <VStack space={2}>
            <Text>
              <Trans>Language</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Select
                onValueChange={(value) => {
                  device.state!.uiLanguage = value
                  updateSettings({
                    variables: {
                      config: settings()
                    }
                  })
                  device.save()
                }}
                defaultValue={device.state!.uiLanguage}
                accessibilityLabel="language"
              >
                <Select.Item label="English" value="en" />
                <Select.Item label="Čeština" value="cz" />
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
                  device.state!.theme = value
                  device.save()
                }}
                defaultValue={device.state!.theme}
                accessibilityLabel="theme"
              >
                <Select.Item label="light" value="light" />
                <Select.Item label="dark" value="dark" />
              </Select>
            </Box>
          </VStack>

          {/* // TODO: Rewrite switches to one component and then re-use  */}
          <VStack space={2}>
            <Text>
              <Trans>Security</Trans>
            </Text>
            <Box backgroundColor={itemBg} rounded="xl" p={3}>
              <HStack
                justifyContent="space-between"
                alignContent="center"
                p={2}
              >
                <Text>2FA</Text>
                <Switch
                  defaultIsChecked={device.state!.syncTOTP}
                  onValueChange={(e) => {
                    device.state!.syncTOTP = e
                    updateSettings({
                      variables: {
                        config: settings()
                      }
                    })
                    device.save()
                  }}
                  size="md"
                />
              </HStack>
              <Divider />
              <HStack justifyContent="space-between" p={2}>
                <Text>Biometrics</Text>
                <Switch
                  defaultIsChecked={device.state!.biometricsEnabled}
                  onValueChange={async (e) => {
                    device.state!.biometricsEnabled = e
                    device.save()
                  }}
                  size="md"
                />
              </HStack>
            </Box>
          </VStack>
        </VStack>
      </Center>
    </View>
  )
}
