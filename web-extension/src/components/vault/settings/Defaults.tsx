import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext, useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Center, VStack } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { Form } from '@src/components/util/tsForm'
import { SettingsSubmitButton } from '@src/components/vault/settings/Account'
import { useUpdateDefaultSettingsMutation } from '@shared/graphql/DefaultSettings.codegen'
import {
  DefaultsFormSchema,
  defaultsFormProps
} from '@src/pages-vault/DefaultSettings'

//FIX: Rename
export default function Defaults() {
  const { deviceState } = useContext(DeviceStateContext)
  const [updateDefaultSettings] = useUpdateDefaultSettingsMutation({})

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
      await updateDefaultSettings({
        variables: {
          config: {
            ...data
          }
        }
      })
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
    )
  }
  return null
}
