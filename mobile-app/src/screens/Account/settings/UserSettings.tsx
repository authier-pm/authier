import React, { useEffect, useState } from 'react'

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
import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import { DefaultSettingsInput } from '@shared/generated/graphqlBaseTypes'
import { vaultLockTimeoutOptions } from '@shared/constants'

function UserSettings() {
  const navigation =
    useNavigation<AccountStackScreenProps<'Account'>['navigation']>()
  let deviceState = useDeviceStateStore((state) => state)
  let [clearAndReload, deviceId] = useDeviceStore((state) => [
    state.clearAndReload,
    state.id
  ])

  const [deleteAccount] = useDeleteAccountMutation()
  const { data, refetch } = useDefaultSettingsQuery()

  const [updateDefaultSettings] = useUpdateDefaultDeviceSettingsMutation()
  const [isOpen, setIsOpen] = useState(
    !!deviceState.notificationOnWrongPasswordAttempts
  )
  type SettingsFormType = Omit<DefaultSettingsInput, 'uiLanguage'>
  const [uiLanguage, setUiLanguage] = useState(data?.me.uiLanguage ?? 'en')

  const [form, setForm] = useState<SettingsFormType | null>(null)
  const [previousSettings, setPreviousSettings] =
    useState<SettingsFormType | null>(null)
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  const defaultData = data?.me.defaultDeviceSettings

  useEffect(() => {
    if (defaultData && !form) {
      const formData = {
        vaultLockTimeoutSeconds: defaultData.vaultLockTimeoutSeconds,
        theme: defaultData.theme,
        syncTOTP: defaultData.syncTOTP,
        autofillCredentialsEnabled: defaultData.autofillCredentialsEnabled,
        autofillTOTPEnabled: defaultData.autofillTOTPEnabled
      }

      setForm(formData)
    }

    if (!previousSettings && data) {
      setPreviousSettings(form)
      return
    }

    const settingsChanged =
      JSON.stringify(previousSettings) !== JSON.stringify(form)

    if (settingsChanged && form) {
      ;(async () => {
        const config = {
          theme: form.theme,
          vaultLockTimeoutSeconds: form.vaultLockTimeoutSeconds,
          autofillTOTPEnabled: form.autofillTOTPEnabled,
          autofillCredentialsEnabled: form.autofillCredentialsEnabled,
          syncTOTP: form.syncTOTP,
          uiLanguage
        }

        await updateDefaultSettings({
          variables: {
            config
          }
        })
        refetch()
      })()
    }

    setPreviousSettings(form)
  }, [defaultData, form])

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

            <AuthierSelect
              onValueChange={(uiLanguage) => {
                setUiLanguage(uiLanguage)
              }}
              selectedValue={uiLanguage}
              accessibilityLabel="language"
            >
              <Select.Item label="English" value="en" />
              <Select.Item label="Čeština" value="cs" />
            </AuthierSelect>
          </VStack>
          {/** **/}
          <Heading size="md">
            <Trans>New device default settings</Trans>
          </Heading>

          <VStack space={2} backgroundColor={itemBg} rounded="xl" p={3}>
            <AuthierSelect
              variant="rounded"
              onValueChange={(value) => {
                setForm({
                  ...(form as DefaultSettingsInput),
                  vaultLockTimeoutSeconds: parseInt(value)
                })
              }}
              selectedValue={(
                form?.vaultLockTimeoutSeconds ?? 28800
              ).toString()}
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

            <Divider />
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>2FA</Text>
              <Switch
                value={form?.syncTOTP}
                onToggle={async (e) => {
                  setForm({ ...(form as DefaultSettingsInput), syncTOTP: e })
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>Credentials autofill</Text>
              <Switch
                value={form?.autofillCredentialsEnabled}
                onToggle={async (e) => {
                  setForm({
                    ...(form as DefaultSettingsInput),
                    autofillCredentialsEnabled: e
                  })
                }}
                size="md"
              />
            </HStack>
            <HStack justifyContent="space-between" alignContent="center" p={2}>
              <Text>TOTP autofill</Text>
              <Switch
                value={form?.autofillTOTPEnabled}
                onToggle={async (e) => {
                  setForm({
                    ...(form as DefaultSettingsInput),
                    autofillTOTPEnabled: e
                  })
                }}
                size="md"
              />
            </HStack>

            <AuthierSelect
              onValueChange={(theme) => {
                setForm({
                  ...(form as DefaultSettingsInput),
                  theme
                })
              }}
              selectedValue={form?.theme}
              accessibilityLabel="theme"
            >
              <Select.Item value="Light" label={t`Light`} />
              <Select.Item value="Dark" label={t`Dark`} />
            </AuthierSelect>
          </VStack>
          {/** **/}
          <Heading size="md">
            <Trans>Danger zone</Trans>
          </Heading>

          {deviceId === data?.me.masterDeviceId ? (
            <SettingsItem
              name={t`Change master password`}
              onPress={() => navigation.navigate('ChangeMasterPassword')}
              key={'ChangeMasterPassword'}
            />
          ) : null}
          <ButtonWithAlert
            btnText={t`Delete your account`}
            btnColor="danger"
            icon="log-out-outline"
            text={t`You cannot undo this action afterwards. Make sure to
              backup data that you want to keep.`}
            onPress={async () => {
              await deleteAccount()
              clearAndReload()
            }}
          />
        </VStack>
      </Center>
    </ScrollView>
  )
}

export default UserSettings
