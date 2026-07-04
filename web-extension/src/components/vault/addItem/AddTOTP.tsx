import { Formik, FormikHelpers, useField } from 'formik'
import { useNavigate } from 'react-router-dom'

import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretsType } from '@src/generated/graphqlBaseTypes'
import { TotpTypeWithMeta } from '@src/util/useDeviceState'
import { TOTPSchema } from '@shared/formikSharedTypes'
import { Input } from '@src/components/ui/input'
import { EditFormButtons } from '../EditFormButtons'
import { cn } from '@src/lib/cn'

export const AddTOTP = () => {
  const navigate = useNavigate()
  const urlQuery = new URLSearchParams(window.location.hash.split('?')[1])

  return (
    <div className="w-full px-5 py-6">
      <Formik
        enableReinitialize
        initialValues={{
          url: urlQuery.get('url') || '',
          secret: '',
          label: '',
          iconUrl: '',
          digits: 6,
          period: 30
        }}
        validationSchema={TOTPSchema}
        // @ts-expect-error
        onSubmit={async (
          values: TotpTypeWithMeta,
          { setSubmitting }: FormikHelpers<TotpTypeWithMeta>
        ) => {
          await device.state?.addSecrets([
            {
              kind: EncryptedSecretsType.TOTP as any,
              totp: values,
              encrypted: await device.state!.encrypt(JSON.stringify(values)),
              createdAt: new Date().toJSON()
            }
          ])

          setSubmitting(false)
          navigate(-1)
        }}
      >
        {({ handleSubmit }) => (
          <form
            className="grid w-full gap-5 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <TextField
              label="URL"
              name="url"
              placeholder="https://example.com"
            />
            <TextField label="Label" name="label" />
            <TextField className="md:col-span-2" label="Secret" name="secret" />
            <NumberField label="Digits" name="digits" />
            <NumberField label="Period" name="period" />
            <div className="md:col-span-2">
              <EditFormButtons />
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}

function TextField({
  label,
  name,
  className,
  placeholder
}: {
  className?: string
  label: string
  name: string
  placeholder?: string
}) {
  const [field, meta] = useField<string>(name)

  return (
    <label className={cn('block space-y-2', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input
        {...field}
        className={cn(
          meta.touched && meta.error
            ? 'border-danger focus:border-danger focus:ring-danger/30'
            : undefined
        )}
        placeholder={placeholder}
      />
      {meta.touched && meta.error ? (
        <p className="text-xs text-danger">{meta.error}</p>
      ) : null}
    </label>
  )
}

function NumberField({ label, name }: { label: string; name: string }) {
  const [field, meta, helpers] = useField<number | string>(name)

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input
        className={cn(
          meta.touched && meta.error
            ? 'border-danger focus:border-danger focus:ring-danger/30'
            : undefined
        )}
        min={0}
        type="number"
        value={field.value}
        onChange={(event) => {
          const nextValue = Number.parseInt(event.target.value, 10)
          helpers.setValue(Number.isNaN(nextValue) ? 0 : nextValue)
        }}
      />
      {meta.touched && meta.error ? (
        <p className="text-xs text-danger">{meta.error}</p>
      ) : null}
    </label>
  )
}
