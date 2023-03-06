import { z } from 'zod'
import { Form, selectFieldSchema } from '../util/tsForm'
import { useForm } from 'react-hook-form'

const VaultConfigFormSchema = z.object({
  lockTime: selectFieldSchema.describe('Lock time // Choose lock time'),
  language: selectFieldSchema.describe('Language // Choose language'),
  twoFA: z.boolean(),
  autofill: z.boolean()
})

export default function VaultConfigForm() {
  const form = useForm<z.infer<typeof VaultConfigFormSchema>>({
    defaultValues: {
      language: 'cz',
      lockTime: '4 hours',
      twoFA: false,
      autofill: true
    }
  })
  const { reset, formState } = form

  function onSubmit(data: z.infer<typeof VaultConfigFormSchema>) {
    // gets typesafe data when form is submitted

    console.log('data', data, form.formState.defaultValues)
  }

  return (
    <Form
      form={form}
      props={{
        language: {
          options: ['cz', 'en']
        },
        lockTime: {
          //TODO: This data structure is retarded,
          options: [
            ['1 minute', 20],
            ['2 minutes', 120],
            ['1 hour', 3600],
            ['4 hours', 14400],
            ['8 hours', 28800],
            ['1 day', 86400],
            ['1 week', 604800],
            ['1 month', 2592000],
            ['Never', 0]
          ]
        }
      }}
      schema={VaultConfigFormSchema}
      onSubmit={onSubmit}
    />
  )
}
