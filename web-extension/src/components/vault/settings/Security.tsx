import { z } from 'zod'
import {
  Form,
  selectTextFieldSchema,
  selectNumberFieldSchema
} from '../../util/tsForm'
import { useForm } from 'react-hook-form'
import {
  useUpdateSettingsMutation,
  SyncSettingsDocument
} from '@shared/graphql/Settings.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext, useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { VStack } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { SettingsSubmitButton } from './Account'
import { vaultLockTimeoutOptions } from '@shared/constants'

const VaultConfigFormSchema = z.object({
  vaultLockTimeoutSeconds: selectNumberFieldSchema.describe(
    t`Lock time // Choose lock time`
  ),
  uiLanguage: selectTextFieldSchema.describe(t`Language // Choose language`),
  autofillCredentialsEnabled: z.boolean().describe(t`Credentials autofill`),
  autofillTOTPEnabled: z.boolean().describe(t`TOTP autofill`),
  syncTOTP: z.boolean().describe(t`2FA sync`),
  notificationOnWrongPasswordAttempts: z
    .number()
    .describe('Number of wrong password attempts for notification'),
  notificationOnVaultUnlock: z
    .boolean()
    .describe('Notification on vault unlock')
})

export default function Security() {
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }]
  })

  if (deviceState) {
    const form = useForm<z.infer<typeof VaultConfigFormSchema>>({
      defaultValues: {
        autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
        autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
        uiLanguage: deviceState.uiLanguage,
        syncTOTP: deviceState.syncTOTP,
        vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds,
        notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
        notificationOnWrongPasswordAttempts:
          deviceState.notificationOnWrongPasswordAttempts
      },
      mode: 'onChange'
    })

    const {
      formState: { isDirty, isSubmitting, isSubmitSuccessful },
      reset
    } = form

    async function onSubmit(data: z.infer<typeof VaultConfigFormSchema>) {
      await updateSettings({
        variables: {
          config: {
            ...data
          }
        }
      })
      setSecuritySettings({ ...data })
    }

    useEffect(() => {
      reset({
        autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
        autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
        uiLanguage: deviceState.uiLanguage,
        syncTOTP: deviceState.syncTOTP,
        vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds,
        notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
        notificationOnWrongPasswordAttempts:
          deviceState.notificationOnWrongPasswordAttempts
      })
    }, [isSubmitSuccessful])

    return (
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
        mt={8}
        spacing={20}
        rounded={'lg'}
        boxShadow={'lg'}
        p={30}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <Form
          form={form}
          props={{
            uiLanguage: {
              options: ['cs', 'en']
            },
            vaultLockTimeoutSeconds: {
              options: vaultLockTimeoutOptions
            }
          }}
          schema={VaultConfigFormSchema}
          onSubmit={onSubmit}
          formProps={{
            submitButton: (
              <SettingsSubmitButton
                isDirty={isDirty}
                isSubmitting={isSubmitting}
              />
            ),
            formHeading: t`Basic security settings`
          }}
        />
      </VStack>
    )
  }
  return null
}
