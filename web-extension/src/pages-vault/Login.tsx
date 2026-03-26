import React, { createContext, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { LoginAwaitingApproval } from './LoginAwaitingApproval'

const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).describe('Email'),
  password: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Password // *******`)
})

export interface LoginFormValues {
  password: string
  email: string
  isSubmitted: boolean
}

export const LoginContext = createContext<{
  formStateContext: LoginFormValues
  setFormStateContext: Dispatch<SetStateAction<LoginFormValues>>
}>({
  formStateContext: {
    password: '',
    email: '',
    isSubmitted: false
  },
  setFormStateContext: () => {}
})

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => {
  return (
    <Button className="mt-1 w-full" disabled={isSubmitting} type="submit" variant="outline">
      <Trans>Submit</Trans>
    </Button>
  )
}

export default function Login(): ReactElement {
  const [formStateContext, setFormStateContext] = useState<LoginFormValues>({
    password: '',
    email: '',
    isSubmitted: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange'
  })

  if (!device.id) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

  if (formStateContext.isSubmitted) {
    return (
      <LoginContext.Provider value={{ formStateContext, setFormStateContext }}>
        <LoginAwaitingApproval />
      </LoginContext.Provider>
    )
  }

  const onSubmit = async (data: z.infer<typeof LoginFormSchema>) => {
    setFormStateContext({
      ...data,
      isSubmitted: true
    })
  }

  return (
    <div className="extension-surface min-w-[400px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-8 shadow-lg">
      <h3 className="mb-5 text-2xl font-semibold text-[color:var(--color-foreground)]">
        <Trans>Login</Trans>
      </h3>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block">
          <div className="mb-2 text-sm font-medium">Email</div>
          <Input type="email" {...register('email')} />
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
              autoComplete="off"
              className="pr-10"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
            />
            <button
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[color:var(--color-muted)]"
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
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
      <div className="pt-3">
        <Link className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]" to="/signup">
          <Trans>Don't have account?</Trans>
        </Link>
      </div>
    </div>
  )
}
