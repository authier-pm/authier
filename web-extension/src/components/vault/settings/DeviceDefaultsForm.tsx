import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Spinner, VStack } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { Form } from '@src/components/util/tsForm'
import { SettingsSubmitButton } from '@src/components/vault/settings/Account'
import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import {
  DefaultsFormSchema,
  defaultsFormProps
} from '@src/pages-vault/DefaultSettings'

export function DeviceDefaultsForm() {
  const { data, loading } = useDefaultSettingsQuery()
  const [updateDefaultSettings] = useUpdateDefaultDeviceSettingsMutation({})
  const bgColor = useColorModeValue('white', 'gray.800')

  const form = useForm<z.infer<typeof DefaultsFormSchema>>({
    defaultValues: {
      autofillTOTPEnabled: data?.me.defaultDeviceSettings.autofillTOTPEnabled,
      autofillCredentialsEnabled:
        data?.me.defaultDeviceSettings.autofillCredentialsEnabled,
      syncTOTP: data?.me.defaultDeviceSettings.syncTOTP,
      vaultLockTimeoutSeconds:
        data?.me.defaultDeviceSettings.vaultLockTimeoutSeconds,
      theme: data?.me.defaultDeviceSettings.theme
    },
    mode: 'onChange'
  })

  console.log(data)
  const {
    formState: { isDirty, isSubmitting, isSubmitSuccessful },
    reset
  } = form

  useEffect(() => {
    const defaultsData = data?.me.defaultDeviceSettings
    reset({
      autofillTOTPEnabled: defaultsData?.autofillTOTPEnabled,
      autofillCredentialsEnabled: defaultsData?.autofillCredentialsEnabled,
      syncTOTP: defaultsData?.syncTOTP,
      vaultLockTimeoutSeconds: defaultsData?.vaultLockTimeoutSeconds,
      theme: defaultsData?.theme
    })
  }, [isSubmitSuccessful, data])

  async function onSubmit(data: z.infer<typeof DefaultsFormSchema>) {
    await updateDefaultSettings({
      variables: {
        config: {
          ...data
        }
      }
    })
  }

  if (loading || !data) return <Spinner />

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
  )
}
