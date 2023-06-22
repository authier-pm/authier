import React, { useState } from 'react'

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
import {
  useSyncDefaultSettingsQuery,
  useUpdateDefaultSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import { DefaultSettingsInput } from '@shared/generated/graphqlBaseTypes'
import { Loading } from '@src/components/Loading'

function UserSettings() {
  const navigation =
    useNavigation<AccountStackScreenProps<'Account'>['navigation']>()
  let deviceState = useDeviceStateStore((state) => state)
  let device = useDeviceStore((state) => state)

  const [deleteAccount] = useDeleteAccountMutation()
  const { data, loading } = useSyncDefaultSettingsQuery({
    fetchPolicy: 'network-only'
  })
  const [updateDefaultSettings] = useUpdateDefaultSettingsMutation()
  const [isOpen, setIsOpen] = useState(
    !!deviceState.notificationOnWrongPasswordAttempts
  )
  //WARNING: Why does it return an array?
  const [form, setForm] = useState<DefaultSettingsInput | null>(null)
  const [previousSettings, setPreviousSettings] =
    useState<DefaultSettingsInput | null>(null)
  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')

  React.useEffect(() => {
    if (data && !form) {
      const defaultData = data?.me.DefaultSettings[0]
      setForm({
        vaultLockTimeoutSeconds: defaultData?.vaultLockTimeoutSeconds,
        uiLanguage: defaultData?.uiLanguage,
        theme: defaultData?.deviceTheme,
        syncTOTP: defaultData?.deviceSyncTOTP,
        autofillCredentialsEnabled: defaultData?.autofillCredentialsEnabled,
        autofillTOTPEnabled: defaultData?.autofillTOTPEnabled
      })
    }

    if (!previousSettings && data) {
      setPreviousSettings(form)
      return
    }

    const settingsChanged =
      JSON.stringify(previousSettings) !== JSON.stringify(form)

    if (settingsChanged && form) {
      updateDefaultSettings({
        variables: {
          config: {
            uiLanguage: form?.uiLanguage,
            theme: form.theme,
            vaultLockTimeoutSeconds: form.vaultLockTimeoutSeconds,
            autofillTOTPEnabled: form.autofillTOTPEnabled,
            autofillCredentialsEnabled: form.autofillCredentialsEnabled,
            syncTOTP: form.syncTOTP
          }
        }
      })
    }

    setPreviousSettings(form)
  }, [deviceState, data, loading, form])

  if (loading) {
    return <Loading />
  }

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
                setForm({
                  ...(form as DefaultSettingsInput),
                  vaultLockTimeoutSeconds: parseInt(value)
                })
              }}
              selectedValue={form?.vaultLockTimeoutSeconds.toString()}
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
              onValueChange={(uiLanguage) => {
                setForm({
                  ...(form as DefaultSettingsInput),
                  uiLanguage
                })
              }}
              selectedValue={form?.uiLanguage}
              accessibilityLabel="language"
            >
              <Select.Item label="English" value="en" />
              <Select.Item label="Čeština" value="cs" />
            </AuthierSelect>
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
