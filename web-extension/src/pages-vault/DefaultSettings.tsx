import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext, useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Center, VStack } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import {
  Form,
  selectNumberFieldSchema,
  selectTextFieldSchema
} from '@src/components/util/tsForm'
import { SettingsSubmitButton } from '@src/components/vault/settings/Account'
import { useUpdateDefaultDeviceSettingsMutation } from '@shared/graphql/DefaultSettings.codegen'
import { useUpdateSettingsMutation } from '@shared/graphql/Settings.codegen'
import { vaultLockTimeoutOptions } from '@shared/constants'

export const DefaultsFormSchema = z.object({
  vaultLockTimeoutSeconds: selectNumberFieldSchema.describe(
    t`Lock time // Choose lock time`
  ),
  uiLanguage: selectTextFieldSchema.describe(t`Language // Choose language`),
  autofillCredentialsEnabled: z.boolean().describe(t`Credentials autofill`),
  autofillTOTPEnabled: z.boolean().describe(t`TOTP autofill`),
  syncTOTP: z.boolean().describe(t`2FA sync`),
  theme: selectTextFieldSchema.describe(t`Theme // Choose theme`)
})

export const defaultsFormProps = {
  uiLanguage: {
    options: ['cs', 'en']
  },
  vaultLockTimeoutSeconds: {
    options: vaultLockTimeoutOptions
  },
  theme: {
    options: [t`Light`, t`Dark`]
  }
}

export default function DefaultSettings() {
  const { setSecuritySettings, deviceState, setFirstTimeUser } =
    useContext(DeviceStateContext)
  const [updateDefaultSettings] = useUpdateDefaultDeviceSettingsMutation()
  const [updateSettings] = useUpdateSettingsMutation()
  const bgColor = useColorModeValue('white', 'gray.800')

  if (deviceState) {
    const form = useForm<z.infer<typeof DefaultsFormSchema>>({
      defaultValues: {
        autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
        autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
        uiLanguage: deviceState.uiLanguage,
        syncTOTP: deviceState.syncTOTP,
        vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds
      },
      mode: 'onChange'
    })

    const {
      formState: { isDirty, isSubmitting, isSubmitSuccessful },
      reset
    } = form

    async function onSubmit(data: z.infer<typeof DefaultsFormSchema>) {
      const config = {
        syncTOTP: data.syncTOTP,
        uiLanguage: data.uiLanguage,
        vaultLockTimeoutSeconds: data.vaultLockTimeoutSeconds,
        autofillCredentialsEnabled: data.autofillCredentialsEnabled,
        autofillTOTPEnabled: data.autofillTOTPEnabled,
        notificationOnWrongPasswordAttempts:
          deviceState?.notificationOnWrongPasswordAttempts as number,
        notificationOnVaultUnlock:
          deviceState?.notificationOnVaultUnlock as boolean
      }
      console.log({ config })
      await updateSettings({
        variables: {
          config: config
        }
      })
      await updateDefaultSettings({
        variables: {
          config: {
            ...data
          }
        }
      })
      setSecuritySettings({
        ...data,
        notificationOnVaultUnlock:
          deviceState?.notificationOnVaultUnlock as boolean,
        notificationOnWrongPasswordAttempts:
          deviceState?.notificationOnWrongPasswordAttempts as number
      })

      setFirstTimeUser(false)
    }

    useEffect(() => {
      reset({
        autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
        autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
        uiLanguage: deviceState.uiLanguage,
        syncTOTP: deviceState.syncTOTP,
        vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds
      })
    }, [isSubmitSuccessful])

    return (
      <Center>
        <VStack
          width={'70%'}
          maxW="600px"
          alignItems={'normal'}
          mt={8}
          spacing={20}
          rounded={'lg'}
          boxShadow={'lg'}
          p={30}
          bg={bgColor}
        >
          <Form
            form={form}
            props={defaultsFormProps}
            schema={DefaultsFormSchema}
            onSubmit={onSubmit}
            formProps={{
              submitButton: (
                <SettingsSubmitButton
                  isDirty={isDirty}
                  isSubmitting={isSubmitting}
                />
              ),
              formHeading: t`Set default settings for new device`
            }}
          />
        </VStack>
      </Center>
    )
  }
  return null
}
