import {
  Box,
  Center,
  Select,
  useColorModeValue,
  VStack,
  HStack,
  Switch,
  Heading,
  Text,
  Button,
  useColorMode,
  Modal
} from 'native-base'

import { Trans, t } from '@lingui/macro'
import { AuthierSelect } from '@src/components/AuthierSelect'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import React, { useEffect, useState } from 'react'
import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { useDefaultDeviceSettingsModalQuery } from './DefaultDeviceSettingsModal.codegen'
import { omit } from 'lodash'
import { useLingui } from '@lingui/react'
import { useVaultLockTimeoutOptions } from '@src/utils/useVaultLockTimeoutOptions'

/**
 * should only show after signup
 */
export function DefaultDeviceSettingsModal() {
  const [notificationOnWrongPasswordAttempts, notificationOnVaultUnlock] =
    useDeviceStateStore((state) => [
      state.notificationOnWrongPasswordAttempts,
      state.notificationOnVaultUnlock
    ])
  const options = useVaultLockTimeoutOptions()
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  const { i18n } = useLingui()
  const { toggleColorMode } = useColorMode()
  const [updateDefaultSettings, { loading }] =
    useUpdateDefaultDeviceSettingsMutation()
  const [updateSettings] = useUpdateSettingsMutation()
  const { data } = useDefaultSettingsQuery()
  const checkQuery = useDefaultDeviceSettingsModalQuery()
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    // this is only used right after signup, so no need to fetch this data from backend
    vaultLockTimeoutSeconds: 28800,
    uiLanguage: 'en',
    theme: 'dark',
    syncTOTP: true,
    autofillCredentialsEnabled: true,
    autofillTOTPEnabled: true
  })

  useEffect(() => {
    if (
      checkQuery.data?.me.devicesCount === 1 &&
      checkQuery.data?.me.defaultDeviceSettings.id === 0 // we keep showing this modal until user sets default settings
    ) {
      setShowModal(true)
    }
  }, [checkQuery.data])

  return (
    <Modal
      isOpen={showModal}
      size={'full'}
      height={'100%'}
      onClose={() => setShowModal(false)}
    >
      <Modal.Content>
        <Modal.Header>
          <Trans>Set default settings for new devices</Trans>
        </Modal.Header>
        <Modal.Body>
          <Center h={'100%'}>
            {/*  */}
            <VStack space={2}>
              <Text maxW={'100%'}>
                Before adding any more devices, please take the time to
                configure your device settings for all devices added in the
                future
              </Text>
              <VStack space={2} rounded="xl" p={3} bg={itemBg}>
                <VStack space={2}>
                  <Trans>Lock time </Trans>
                  <Box p={2}>
                    <AuthierSelect
                      variant="rounded"
                      onValueChange={(value) => {
                        setForm({
                          ...form,
                          vaultLockTimeoutSeconds: Number(value)
                        })
                      }}
                      selectedValue={form.vaultLockTimeoutSeconds.toString()}
                      accessibilityLabel="Lock time"
                    >
                      {options.map((option, index) => {
                        console.log(option.label)
                        return (
                          <Select.Item
                            label={option.label}
                            value={option.value.toString()}
                            key={index}
                          />
                        )
                      })}
                    </AuthierSelect>

                    <Trans>
                      Automatically locks vault after chosen period of time, use
                      lower values for more security, higher for more user
                      comfort
                    </Trans>
                  </Box>
                </VStack>
              </VStack>
              <VStack space={2} rounded="xl" p={3} bg={itemBg}>
                <HStack
                  justifyContent="space-between"
                  alignContent="center"
                  p={2}
                >
                  <Trans>2FA</Trans>
                  <Switch
                    value={form.syncTOTP}
                    onToggle={async (e) => {
                      setForm({ ...form, syncTOTP: e })
                    }}
                    size="md"
                  />
                </HStack>
                <HStack
                  justifyContent="space-between"
                  alignContent="center"
                  p={2}
                >
                  <Trans>Credentials autofill</Trans>
                  <Switch
                    value={form.autofillCredentialsEnabled}
                    onToggle={async (e) => {
                      setForm({ ...form, autofillCredentialsEnabled: e })
                    }}
                    size="md"
                  />
                </HStack>
                <HStack
                  justifyContent="space-between"
                  alignContent="center"
                  p={2}
                >
                  <Trans>TOTP autofill</Trans>
                  <Switch
                    value={form.autofillTOTPEnabled}
                    onToggle={async (e) => {
                      setForm({ ...form, autofillTOTPEnabled: e })
                    }}
                    size="md"
                  />
                </HStack>
                <VStack />
              </VStack>
            </VStack>

            {/*  */}
            <VStack space={2} rounded="xl" p={2} bg={itemBg} mt={2}>
              <Heading size="md">Language </Heading>

              <Box p={2} rounded="xl" minW="95%">
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
            <VStack space={2} rounded="xl" p={2} bg={itemBg} mt={2}>
              <Heading size="md">Theme</Heading>

              <Box p={2} rounded="xl" minW={'95%'}>
                <AuthierSelect
                  onValueChange={(value) => {
                    toggleColorMode()
                    setForm({ ...form, theme: value })
                  }}
                  selectedValue={form.theme}
                  accessibilityLabel="theme"
                >
                  <Select.Item label={t`Light`} value="light" />
                  <Select.Item label={t`Dark`} value="dark" />
                </AuthierSelect>
              </Box>
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

                const defaultDeviceSettings = omit(
                  data?.me.defaultDeviceSettings,
                  ['__typename', 'theme', 'id']
                )
                const config = {
                  ...(defaultDeviceSettings ?? {}),
                  ...formData,
                  notificationOnWrongPasswordAttempts:
                    notificationOnWrongPasswordAttempts,
                  notificationOnVaultUnlock: notificationOnVaultUnlock
                }

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

                checkQuery.refetch()

                useDeviceStateStore.setState({
                  ...formData,
                  lockTimeEnd: Date.now() + form.vaultLockTimeoutSeconds * 1000
                })

                setShowModal(false)
              }}
              mt={3}
            >
              <Trans>Save default settings</Trans>
            </Button>
          </Center>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  )
}
