import {
  Box,
  Center,
  Select,
  useColorModeValue,
  VStack,
  HStack,
  Switch,
  Divider,
  Heading,
  Text,
  Button,
  useColorMode
} from 'native-base'

import { Trans, t } from '@lingui/macro'
import AuthierSelect from '@src/components/AuthierSelect'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'
import React, { useState } from 'react'
import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '../../../shared/graphql/DefaultSettings.codegen'
import { i18n } from '@lingui/core'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { vaultLockTimeoutOptions } from '@shared/constants'

export function DefaultDeviceSettingsForm() {
  const deviceState = useDeviceStateStore((state) => state)
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  const bgColor = useColorModeValue('white', 'rgb(1, 1, 1)')
  const { toggleColorMode } = useColorMode()
  const [updateDefaultSettings, { loading }] =
    useUpdateDefaultDeviceSettingsMutation()
  const [updateSettings] = useUpdateSettingsMutation()
  const { data } = useDefaultSettingsQuery()

  const [form, setForm] = useState({
    vaultLockTimeoutSeconds: 28800,
    uiLanguage: 'en',
    theme: 'dark',
    syncTOTP: true,
    autofillCredentialsEnabled: true,
    autofillTOTPEnabled: true
  })

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
                    // device.setLockTime(parseInt(value, 10))
                    setForm({ ...form, vaultLockTimeoutSeconds: Number(value) })
                  }}
                  selectedValue={form.vaultLockTimeoutSeconds.toString()}
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
                value={form.syncTOTP}
                onToggle={async (e) => {
                  setForm({ ...form, syncTOTP: e })
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>Credentials autofill</Text>
              <Switch
                value={form.autofillCredentialsEnabled}
                onToggle={async (e) => {
                  setForm({ ...form, autofillCredentialsEnabled: e })
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>TOTP autofill</Text>
              <Switch
                value={form.autofillTOTPEnabled}
                onToggle={async (e) => {
                  setForm({ ...form, autofillTOTPEnabled: e })
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
                setForm({ ...form, uiLanguage: value })
                i18n.activate(value)
              }}
              defaultValue={form.uiLanguage}
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
                setForm({ ...form, theme: value })
              }}
              defaultValue={form.theme}
              accessibilityLabel="theme"
            >
              <Select.Item label={t`light`} value="light" />
              <Select.Item label={t`dark`} value="dark" />
            </AuthierSelect>
          </Box>
        </VStack>
      </VStack>
      <Button
        isLoading={loading}
        onPress={async () => {
          const formData = {
            uiLanguage: form.uiLanguage,
            autofillCredentialsEnabled: form.autofillCredentialsEnabled,
            syncTOTP: form.syncTOTP,
            autofillTOTPEnabled: form.autofillTOTPEnabled,
            vaultLockTimeoutSeconds: form.vaultLockTimeoutSeconds
          }

          const config = {
            ...(data?.me.defaultDeviceSettings ?? {}),
            ...formData,
            notificationOnWrongPasswordAttempts:
              deviceState.notificationOnWrongPasswordAttempts,
            notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock
          }

          console.log({ config })
          await updateSettings({
            variables: {
              config
            }
          })

          await updateDefaultSettings({
            variables: {
              config: {
                ...formData,
                theme: form.theme
              }
            }
          })

          useDeviceStateStore.setState({
            ...formData,
            lockTimeEnd: Date.now() + form.vaultLockTimeoutSeconds * 1000
          })
        }}
        mt={3}
      >
        <Trans>Save default settings</Trans>
      </Button>
    </Center>
  )
}
