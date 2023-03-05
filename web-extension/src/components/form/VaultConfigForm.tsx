import { z } from 'zod'
import { Form, selectFieldSchema } from '../util/tsForm'

const VaultConfigFormSchema = z.object({
  lockTime: selectFieldSchema,
  language: selectFieldSchema,
  twoFA: z.boolean(),
  autofill: z.boolean()
})

export default function VaultConfigForm() {
  function onSubmit(data: z.infer<typeof VaultConfigFormSchema>) {
    // gets typesafe data when form is submitted
  }

  return (
    <Form
      props={{
        language: {
          options: ['cz', 'en'],
          label: 'Language'
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
          ],
          label: 'Lock time'
        }
      }}
      schema={VaultConfigFormSchema}
      onSubmit={onSubmit}
    />
  )
}
