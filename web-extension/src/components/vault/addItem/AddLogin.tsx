import { useId, useState, type InputHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, useField, useFormikContext } from 'formik'
import { FiCheck, FiEye, FiEyeOff, FiLock } from 'react-icons/fi'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import {
  PasswordSchema,
  type credentialValues
} from '@shared/formikSharedTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import {
  defaultPasswordGeneratorConfig,
  generate
} from '@shared/passwordGenerator'
import { submitVaultForm } from '@src/util/submitVaultForm'
import { cn } from '@src/lib/cn'
import { evaluatePasswordStrength } from '../evaluatePasswordStrength'

export const AddLogin = () => {
  const navigate = useNavigate()
  const [initialValues] = useState<credentialValues>(() => ({
    url:
      new URLSearchParams(window.location.hash.split('?')[1]).get('url') || '',
    password: generate(defaultPasswordGeneratorConfig),
    label: '',
    username: ''
  }))

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PasswordSchema}
      onSubmit={async (values, { setStatus }) => {
        const credentials = loginCredentialsSchema.parse({
          ...values,
          iconUrl: null
        })
        const saved = await submitVaultForm(async () => {
          const state = device.state
          if (!state) throw new Error('Unlock the vault to save this item')
          await state.addSecrets([
            {
              kind: EncryptedSecretType.LOGIN_CREDENTIALS,
              loginCredentials: credentials,
              encrypted: '',
              createdAt: new Date().toJSON()
            }
          ])
        }, setStatus)
        if (saved) navigate('/')
      }}
    >
      <LoginForm />
    </Formik>
  )
}

function LoginForm() {
  const { handleSubmit, isSubmitting } = useFormikContext<credentialValues>()

  return (
    <form autoComplete="off" noValidate onSubmit={handleSubmit}>
      <fieldset className="space-y-6 p-5 sm:p-7" disabled={isSubmitting}>
        <legend className="sr-only">Login details</legend>
        <div>
          <h2 className="text-base font-semibold">Login details</h2>
          <p className="mt-1 text-sm text-muted">
            Your sign-in details, together in one safe place.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <LoginField
            label="Name"
            name="label"
            optional
            placeholder="e.g. Work Google account"
          />
          <LoginField
            autoCapitalize="none"
            label="Website"
            name="url"
            placeholder="e.g. accounts.google.com"
          />
          <LoginField
            autoCapitalize="none"
            className="sm:col-span-2"
            label="Username or email"
            name="username"
            placeholder="e.g. alex@example.com"
          />
        </div>
        <LoginPassword />
      </fieldset>
      <LoginActions />
    </form>
  )
}

function LoginField({
  className,
  label,
  name,
  optional,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: keyof credentialValues
  optional?: boolean
}) {
  const [field, meta] = useField<string>(name)
  const id = useId()
  const error = meta.touched && meta.error

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className="flex items-baseline gap-2 text-sm font-medium"
        htmlFor={id}
      >
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted">Optional</span>
        )}
      </label>
      <Input
        {...field}
        {...props}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-11 rounded-[var(--radius-sm)]',
          error && 'border-danger'
        )}
        id={id}
        spellCheck={false}
      />
      {error && (
        <p className="text-xs text-danger" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function LoginPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [field, meta, helpers] = useField<string>('password')
  const id = useId()
  const strength = evaluatePasswordStrength(field.value)
  const error = meta.touched && meta.error

  return (
    <section className="space-y-4 border-t border-border/60 pt-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium" htmlFor={id}>
            Password
          </label>
          <span
            className={cn(
              'text-xs',
              strength.id === 3 ? 'text-primary' : 'text-muted'
            )}
          >
            {strength.value}
          </span>
        </div>
        <div className="relative">
          <Input
            {...field}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="new-password"
            className={cn(
              'h-12 rounded-[var(--radius-sm)] pr-12 font-mono',
              error && 'border-danger'
            )}
            id={id}
            spellCheck={false}
            type={showPassword ? 'text' : 'password'}
          />
          <Button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1 top-1 size-10 rounded-[var(--radius-sm)] text-muted"
            onClick={() => setShowPassword((current) => !current)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {showPassword ? (
              <FiEyeOff aria-hidden className="size-4" />
            ) : (
              <FiEye aria-hidden className="size-4" />
            )}
          </Button>
        </div>
        <div
          aria-label={`Password strength: ${strength.value}`}
          className="flex gap-1.5"
          role="img"
        >
          {[0, 1, 2, 3].map((segment) => (
            <span
              className={cn(
                'h-1 flex-1 rounded-full bg-border/50',
                field.value &&
                  segment <= strength.id &&
                  (strength.id === 3 ? 'bg-primary' : 'bg-warning')
              )}
              key={segment}
            />
          ))}
        </div>
        {error && (
          <p className="text-xs text-danger" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
      <PasswordGenerator
        isOpen
        onGenerate={(password) => {
          helpers.setValue(password)
        }}
      />
    </section>
  )
}

function LoginActions() {
  const navigate = useNavigate()
  const { dirty, isSubmitting, status } = useFormikContext<credentialValues>()

  return (
    <div className="space-y-4 border-t border-border/60 bg-background/20 px-5 py-5 sm:px-7">
      {typeof status === 'string' && (
        <p className="text-sm text-danger" role="alert">
          {status}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-xs text-muted">
          <FiLock aria-hidden className="size-3.5" />
          Encrypted before it leaves your device
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 rounded-[var(--radius-sm)] sm:flex-none"
            onClick={() => navigate('/')}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-[var(--radius-sm)] sm:flex-none"
            disabled={isSubmitting || !dirty}
            type="submit"
          >
            <FiCheck aria-hidden className="size-4" />
            {isSubmitting ? 'Saving…' : 'Save login'}
          </Button>
        </div>
      </div>
    </div>
  )
}
