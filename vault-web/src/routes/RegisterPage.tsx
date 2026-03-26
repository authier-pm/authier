import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVaultSession } from '@/providers/VaultSessionProvider'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12)
})

export function RegisterPage() {
  const navigate = useNavigate()
  const { isBusy, register } = useVaultSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      await register(values.email, values.password)
      navigate('/vault')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create account'
      )
    }
  })

  return (
    <div className="vault-grid flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.24em] text-[color:var(--color-muted)] uppercase">
            Authier Vault
          </div>
          <CardTitle className="pt-3 text-2xl">Create your vault</CardTitle>
          <CardDescription>
            Keep your master password local to the browser and start with the
            same dark, dense interface as the extension.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              <p className="text-xs text-[color:var(--color-danger)]">
                {form.formState.errors.email?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Master password</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
              />
              <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 px-3 py-3 text-sm text-[color:var(--color-muted)]">
                Use at least 12 characters. Longer is better.
              </div>
              <p className="text-xs text-[color:var(--color-danger)]">
                {form.formState.errors.password?.message}
              </p>
            </div>

            {errorMessage ? (
              <p className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-4 py-3 text-sm text-[color:var(--color-danger-foreground)]">
                {errorMessage}
              </p>
            ) : null}

            <Button
              className="w-full"
              disabled={isBusy}
              type="submit"
              variant="outline"
            >
              {isBusy ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[color:var(--color-muted)]">
            Already have an account?{' '}
            <Link
              className="font-medium hover:text-[color:var(--color-foreground)]"
              to="/login"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
