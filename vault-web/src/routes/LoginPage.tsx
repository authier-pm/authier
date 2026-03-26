import { zodResolver } from '@hookform/resolvers/zod'
import {
  type LucideIcon,
  Fingerprint,
  ShieldCheck,
  Smartphone
} from 'lucide-react'
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export function LoginPage() {
  const navigate = useNavigate()
  const { isBusy, submitLogin } = useVaultSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      const result = await submitLogin(values.email, values.password)

      navigate(result === 'authenticated' ? '/vault' : '/awaiting-approval')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to start login'
      )
    }
  })

  return (
    <div className="vault-grid flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-5xl overflow-hidden border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <div className="grid md:grid-cols-[1.05fr,0.95fr]">
          <div className="border-b border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(23,39,39,0.98)_0%,rgba(16,23,23,0.95)_100%)] p-8 text-white md:border-b-0 md:border-r md:p-10">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.24em] text-white/70 uppercase">
              Authier Vault
            </div>
            <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-tight tracking-tight">
              Access your vault with the same visual language as the extension.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/72">
              Client-side encryption, trusted-device approval, and local vault
              locking all carry over to the web vault.
            </p>

            <div className="mt-8 space-y-3">
              <FeatureRow
                icon={ShieldCheck}
                text="Secrets stay encrypted in the browser before the API ever sees them."
              />
              <FeatureRow
                icon={Smartphone}
                text="New browsers remain pending until one of your approved devices lets them in."
              />
              <FeatureRow
                icon={Fingerprint}
                text="This session can be locked locally without logging out of your account."
              />
            </div>
          </div>

          <div className="bg-[color:var(--color-surface-muted)]/60 p-6 md:p-10">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Log in</CardTitle>
              <CardDescription>
                Sign in with your account email and master password.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
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
                  {isBusy ? 'Starting login...' : 'Continue'}
                </Button>
              </form>

              <p className="mt-6 text-sm text-[color:var(--color-muted)]">
                New here?{' '}
                <Link
                  className="font-medium hover:text-[color:var(--color-foreground)]"
                  to="/register"
                >
                  Create an account
                </Link>
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  text
}: {
  icon: LucideIcon
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-[color:var(--color-primary)]" />
      <p className="text-sm text-white/75">{text}</p>
    </div>
  )
}
