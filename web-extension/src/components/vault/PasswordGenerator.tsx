import { Formik, FormikHelpers } from 'formik'
import {
  IPasswordGeneratorConfig,
  defaultPasswordGeneratorConfig,
  generate
} from '@shared/passwordGenerator'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'

export const PasswordGenerator = ({
  isOpen,
  onGenerate
}: {
  isOpen: boolean
  onGenerate: (password: string) => void
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <Formik
        initialValues={defaultPasswordGeneratorConfig}
        onSubmit={(
          values: IPasswordGeneratorConfig,
          { setSubmitting }: FormikHelpers<IPasswordGeneratorConfig>
        ) => {
          onGenerate(generate(values))
          setSubmitting(false)
        }}
      >
        {({ handleSubmit, isSubmitting, setFieldValue, values }) => (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)] lg:items-start">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[color:var(--color-foreground)]">
                  Length
                </span>
                <Input
                  min={5}
                  type="number"
                  value={values.length}
                  onChange={(event) => {
                    setFieldValue('length', Number.parseInt(event.target.value))
                  }}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeneratorToggle
                  checked={values.numbers}
                  label="Numbers"
                  onChange={(checked) => {
                    setFieldValue('numbers', checked)
                  }}
                />
                <GeneratorToggle
                  checked={values.symbols}
                  label="Symbols"
                  onChange={(checked) => {
                    setFieldValue('symbols', checked)
                  }}
                />
                <GeneratorToggle
                  checked={values.uppercase}
                  label="Uppercase"
                  onChange={(checked) => {
                    setFieldValue('uppercase', checked)
                  }}
                />
                <GeneratorToggle
                  checked={values.lowercase}
                  label="Lowercase"
                  onChange={(checked) => {
                    setFieldValue('lowercase', checked)
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={isSubmitting} size="sm" type="submit">
                Generate password
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}

function GeneratorToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-sm text-[color:var(--color-foreground)]">
      <input
        checked={checked}
        className="size-4 accent-[color:var(--color-primary)]"
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}
