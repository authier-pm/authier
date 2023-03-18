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

const VaultConfigFormSchema = z.object({
  vaultLockTimeoutSeconds: selectNumberFieldSchema.describe(
    t`Lock time // Choose lock time`
  ),
  uiLanguage: selectTextFieldSchema.describe(t`Language // Choose language`),
  autofillCredentialsEnabled: z.boolean().describe(t`Credentials autofill`),
  autofillTOTPEnabled: z.boolean().describe(t`TOTP autofill`),
  syncTOTP: z.boolean().describe(t`2FA sync`)
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
        vaultLockTimeoutSeconds: deviceState.lockTime
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
        vaultLockTimeoutSeconds: deviceState.lockTime
      })
    }, [isSubmitSuccessful])

    return (
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
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
              options: ['cz', 'en']
            },
            vaultLockTimeoutSeconds: {
              options: [
                { label: t`1 minute`, value: 20 },
                { label: t`2 minutes`, value: 120 },
                { label: t`1 hour`, value: 3600 },
                { label: t`4 hours`, value: 14400 },
                { label: t`8 hours`, value: 28800 },
                { label: t`1 day`, value: 86400 },
                { label: t`1 week`, value: 604800 },
                { label: t`1 month`, value: 2592000 },
                { label: t`Never`, value: 0 }
              ]
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
