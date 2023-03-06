import { z } from 'zod'
import {
  Form,
  selectTextFieldSchema,
  selectNumberFieldSchema
} from '../util/tsForm'
import { useForm } from 'react-hook-form'
import {
  useUpdateSettingsMutation,
  SyncSettingsDocument
} from '@shared/graphql/Settings.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext, useEffect } from 'react'

const VaultConfigFormSchema = z.object({
  vaultLockTimeoutSeconds: selectNumberFieldSchema.describe(
    'Lock time // Choose lock time'
  ),
  language: selectTextFieldSchema.describe('Language // Choose language'),
  syncTOTP: z.boolean(),
  autofill: z.boolean()
})

export default function VaultConfigForm() {
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

    const { formState, reset } = form

    async function onSubmit(data: z.infer<typeof VaultConfigFormSchema>) {
      console.log('data', data.vaultLockTimeoutSeconds)
      const config = {
        ...data,
        vaultLockTimeoutSeconds: parseInt(
          data.vaultLockTimeoutSeconds.toString()
        )
      }

      await updateSettings({
        variables: {
          config
        }
      })
      setSecuritySettings(config)
    }

    useEffect(() => {
      reset({
        autofill: deviceState.autofill,
        language: deviceState.language,
        syncTOTP: deviceState.syncTOTP,
        vaultLockTimeoutSeconds: deviceState.lockTime
      })
    }, [formState.isSubmitSuccessful])

    return (
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
        formProps={{ formState }}
      />
    )
  }
  return null
}
