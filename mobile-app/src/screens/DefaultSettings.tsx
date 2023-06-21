import {
  Box,
  Center,
  Select,
  useColorModeValue,
  VStack,
  useColorMode,
  HStack,
  Switch,
  Divider,
  Heading,
  ScrollView,
  Text,
  Button
} from 'native-base'

import { Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import AuthierSelect from '@src/components/AuthierSelect'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'
import React from 'react'

export default function DefaultSettings() {
  const device = useDeviceStore((state) => state)
  const deviceState = useDeviceStateStore((state) => state)
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  const bgColor = useColorModeValue('white', 'rgb(1, 1, 1)')
  const { toggleColorMode, colorMode } = useColorMode()

  const [form, setForm] = React.useState({})

  console.log('deviceState', colorMode)
  return (
    <Center h={'100%'} bg={bgColor}>
      <Heading size="md" mb={5}>
        <Trans>Set default settings for new devices</Trans>
      </Heading>
      <VStack width="90%" space={4}>
        {/*  */}
        <VStack space={2}>
          <Heading size="md">
            <Trans>Security</Trans>
          </Heading>
          <VStack space={2} rounded="xl" p={3} bg={itemBg}>
            <VStack space={2}>
              <Text>
                <Trans>Lock time</Trans>
              </Text>
              <Box p={2}>
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
              </Box>
            </VStack>
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
          </VStack>
        </VStack>

        {/*  */}
        <VStack space={2} rounded="xl" p={2} bg={itemBg}>
          <Heading size="md">
            <Trans>Language</Trans>
          </Heading>

          <Box p={2} rounded="xl">
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
          </Box>
        </VStack>
        {/*  */}
        <VStack space={2} rounded="xl" p={2} bg={itemBg}>
          <Heading size="md">
            <Trans>Theme</Trans>
          </Heading>

          <Box p={2} rounded="xl">
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
          </Box>
        </VStack>
      </VStack>
      <Button
        onPress={() => {
          console.log('test')
        }}
        mt={3}
      >
        Save default settings
      </Button>
    </Center>
  )
}
