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

const VaultConfigFormSchema = z.object({
  vaultLockTimeoutSeconds: selectNumberFieldSchema.describe(
    'Lock time // Choose lock time'
  ),
  language: selectTextFieldSchema.describe('Language // Choose language'),
  syncTOTP: z.boolean(),
  autofill: z.boolean()
})

export default function Security() {
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }]
  })

  if (deviceState) {
    const form = useForm<z.infer<typeof VaultConfigFormSchema>>({
      defaultValues: {
        autofill: deviceState.autofill,
        language: deviceState.language,
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
        autofill: deviceState.autofill,
        language: deviceState.language,
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
            language: {
              options: ['cz', 'en']
            },
            vaultLockTimeoutSeconds: {
              //TODO: This data structure is retarded,
              options: [
                { label: '1 minute', value: 20 },
                { label: '2 minutes', value: 120 },
                { label: '1 hour', value: 3600 },
                { label: '4 hours', value: 14400 },
                { label: '8 hours', value: 28800 },
                { label: '1 day', value: 86400 },
                { label: '1 week', value: 604800 },
                { label: '1 month', value: 2592000 },
                { label: 'Never', value: 0 }
              ]
            }
          }}
          schema={VaultConfigFormSchema}
          onSubmit={onSubmit}
          formProps={{
            isDirty,
            isSubmitting,
            formHeading: 'Basic security settings'
          }}
        />
      </VStack>
    )
  }
  return null
}
