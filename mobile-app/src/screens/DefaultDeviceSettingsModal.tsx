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
  useColorMode,
  Modal
} from 'native-base'

import { Trans, t } from '@lingui/macro'
import AuthierSelect from '@src/components/AuthierSelect'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'
import React, { useEffect, useState } from 'react'
import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '../../../shared/graphql/DefaultSettings.codegen'
import { i18n } from '@lingui/core'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { vaultLockTimeoutOptions } from '@shared/constants'
import { useDefaultDeviceSettingsModalQuery } from './DefaultDeviceSettingsModal.codegen'
import { omit } from 'lodash'

/**
 * should only show after signup
 */
export function DefaultDeviceSettingsModal() {
  const deviceState = useDeviceStateStore((state) => state)
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

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
      checkQuery.data?.me.defaultDeviceSettings.id === null // we keep showing this modal until user sets default settings
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
                <Trans>
                  Before adding any more devices, please take the time to
                  configure your device settings for all devices added in the
                  future
                </Trans>
              </Text>
              <VStack space={2} rounded="xl" p={3} bg={itemBg}>
                <VStack space={2}>
                  <Text>
                    <Trans>Lock time</Trans>
                  </Text>
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
                        Automatically locks vault after chosen period of time,
                        use lower values for more security, higher for more user
                        comfort
                      </Trans>
                    </Text>
                  </Box>
                </VStack>
              </VStack>
              <VStack space={2} rounded="xl" p={3} bg={itemBg}>
                <HStack
                  justifyContent="space-between"
                  alignContent="center"
                  p={2}
                >
                  <Text>2FA</Text>
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
                  <Text>Credentials autofill</Text>
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
                  <Text>TOTP autofill</Text>
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
              <Heading size="md">
                <Trans>Language</Trans>
              </Heading>

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
              <Heading size="md">
                <Trans>Theme</Trans>
              </Heading>

              <Box p={2} rounded="xl" minW={'95%'}>
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
                  ['__typename', 'theme']
                )
                const config = {
                  ...(defaultDeviceSettings ?? {}),
                  ...formData,
                  notificationOnWrongPasswordAttempts:
                    deviceState.notificationOnWrongPasswordAttempts,
                  notificationOnVaultUnlock:
                    deviceState.notificationOnVaultUnlock
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
