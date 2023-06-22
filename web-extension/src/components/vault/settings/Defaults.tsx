import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect, useMemo } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Spinner, VStack } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { Form } from '@src/components/util/tsForm'
import { SettingsSubmitButton } from '@src/components/vault/settings/Account'
import {
  useSyncDefaultSettingsQuery,
  useUpdateDefaultSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import {
  DefaultsFormSchema,
  defaultsFormProps
} from '@src/pages-vault/DefaultSettings'

//FIX: Rename
export default function Defaults() {
  const { data, loading } = useSyncDefaultSettingsQuery({
    fetchPolicy: 'network-only'
  })
  const [updateDefaultSettings] = useUpdateDefaultSettingsMutation({})
  const bgColor = useColorModeValue('white', 'gray.800')

  const form = useForm<z.infer<typeof DefaultsFormSchema>>({
    defaultValues: {
      autofillTOTPEnabled: data?.me.DefaultSettings[0]?.autofillTOTPEnabled,
      autofillCredentialsEnabled:
        data?.me.DefaultSettings[0]?.autofillCredentialsEnabled,
      uiLanguage: data?.me.DefaultSettings[0]?.uiLanguage,
      syncTOTP: data?.me.DefaultSettings[0]?.deviceSyncTOTP,
      vaultLockTimeoutSeconds:
        data?.me.DefaultSettings[0]?.vaultLockTimeoutSeconds
    },
    mode: 'onChange'
  })

  console.log(data)
  const {
    formState: { isDirty, isSubmitting, isSubmitSuccessful },
    reset
  } = form

  useEffect(() => {
    const defaultsData = data?.me.DefaultSettings[0]
    reset({
      autofillTOTPEnabled: defaultsData?.autofillTOTPEnabled,
      autofillCredentialsEnabled: defaultsData?.autofillCredentialsEnabled,
      uiLanguage: defaultsData?.uiLanguage,
      syncTOTP: defaultsData?.deviceSyncTOTP,
      vaultLockTimeoutSeconds: defaultsData?.vaultLockTimeoutSeconds
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
