import { useState, type ReactElement } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { cn } from '@src/lib/cn'
import { useLoginSession } from '@src/util/useLoginSession'
import type { LoginDraft } from '@src/background/loginSessionTypes'
import { LoginAwaitingApproval } from '@src/components/auth/LoginAwaitingApproval'

const LoginFormSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .describe('Email'),
  password: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Password // *******`)
})

type LoginFormValues = z.infer<typeof LoginFormSchema>

type LoginProps = {
  compact?: boolean
  onSignUp?: () => void
}

type LoginFormProps = {
  compact: boolean
  error: string | null
  initialValues: LoginFormValues
  onDraftChange: (draft: LoginDraft) => Promise<void>
  onSignUp?: () => void
  onSubmit: (draft: LoginDraft) => Promise<unknown>
}

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => (
  <Button
    className="mt-1 h-11 w-full"
    disabled={isSubmitting}
    type="submit"
    variant="outline"
  >
    <Trans>Submit</Trans>
  </Button>
)

const LoginLoading = ({ error }: { error: string | null }) => (
  <div className="flex min-h-[220px] w-full max-w-[350px] flex-col items-center justify-center gap-3 px-4 text-center">
    <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
    {error ? (
      <div className="text-sm text-[color:var(--color-danger)]">{error}</div>
    ) : null}
  </div>
)

function LoginForm({
  compact,
  error,
  initialValues,
  onDraftChange,
  onSignUp,
  onSubmit
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const {
    getValues,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: initialValues,
    mode: 'onChange'
  })
  const emailField = register('email')
  const passwordField = register('password')

  const persistDraft = (draft: LoginDraft) => {
    void onDraftChange(draft).catch((draftError: unknown) => {
      console.error('Failed to preserve login draft', draftError)
    })
  }

  const submit = (values: LoginFormValues) => {
    setSubmissionError(null)
    return onSubmit(values).catch((submitError: unknown) => {
      setSubmissionError(
        submitError instanceof Error
          ? submitError.message
          : 'Login failed, please try again'
      )
    })
  }

  return (
    <div
      className={cn(
        'extension-surface w-full rounded-[var(--radius-lg)] border border-[color:var(--color-border)] shadow-lg',
        compact ? 'max-w-[350px] p-4' : 'max-w-[400px] p-5 sm:p-8'
      )}
    >
      <h3
        className={cn(
          'font-semibold text-[color:var(--color-foreground)]',
          compact ? 'mb-4 text-xl' : 'mb-5 text-2xl'
        )}
      >
        <Trans>Login</Trans>
      </h3>
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <label className="block">
          <div className="mb-2 text-sm font-medium">Email</div>
          <Input
            {...emailField}
            className={compact ? 'h-11 text-base' : undefined}
            autoComplete="email"
            type="email"
            onChange={(event) => {
              void emailField.onChange(event)
              persistDraft({
                email: event.currentTarget.value,
                password: getValues('password')
              })
            }}
          />
          {errors.email ? (
            <div className="mt-1 text-sm text-[color:var(--color-danger)]">
              {errors.email.message}
            </div>
          ) : null}
        </label>

        <label className="block">
          <div className="mb-2 text-sm font-medium">
            <Trans>Password</Trans>
          </div>
          <div className="relative">
            <Input
              {...passwordField}
              autoComplete="off"
              className={cn('pr-11', compact && 'h-11 text-base')}
              placeholder="*******"
              type={showPassword ? 'text' : 'password'}
              onChange={(event) => {
                void passwordField.onChange(event)
                persistDraft({
                  email: getValues('email'),
                  password: event.currentTarget.value
                })
              }}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[color:var(--color-muted)]"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <IoEyeOff className="size-4" />
              ) : (
                <IoEye className="size-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <div className="mt-1 text-sm text-[color:var(--color-danger)]">
              {errors.password.message}
            </div>
          ) : null}
        </label>

        {submissionError || error ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-3 py-2 text-sm text-[color:var(--color-danger)]">
            {submissionError ?? error}
          </div>
        ) : null}

        <SubmitButton isSubmitting={isSubmitting} />
      </form>

      <div className="pt-3">
        {onSignUp ? (
          <button
            className="min-h-10 py-2 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            onClick={onSignUp}
            type="button"
          >
            <Trans>Don't have account?</Trans>
          </button>
        ) : (
          <Link
            className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            to="/signup"
          >
            <Trans>Don't have account?</Trans>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Login({
  compact = false,
  onSignUp
}: LoginProps): ReactElement {
  const {
    session,
    loadError,
    updateDraft,
    startLogin,
    resetLogin,
    initiateMasterDeviceReset
  } = useLoginSession()

  if (!session) {
    return <LoginLoading error={loadError} />
  }

  if (session.status !== 'editing') {
    return (
      <LoginAwaitingApproval
        compact={compact}
        initiateMasterDeviceReset={initiateMasterDeviceReset}
        resetLogin={resetLogin}
        session={session}
      />
    )
  }

  return (
    <LoginForm
      compact={compact}
      error={session.error}
      initialValues={{ email: session.email, password: session.password }}
      onDraftChange={updateDraft}
      onSignUp={onSignUp}
      onSubmit={startLogin}
    />
  )
}
