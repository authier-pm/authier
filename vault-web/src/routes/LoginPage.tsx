import { zodResolver } from '@hookform/resolvers/zod'
import { Fingerprint } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <Card className="w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr,0.9fr]">
          <div className="bg-[color:var(--color-secondary)] p-8 text-white md:p-12">
            <div className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
              Authier Vault
            </div>
            <h1 className="mt-6 font-serif text-4xl leading-tight">
              Access your passwords from anywhere without lowering the bar.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/72">
              The web vault keeps secrets encrypted client-side, still requiring
              your master password and device approval for new browser sessions.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/20 bg-white/8 p-4">
              <Fingerprint className="size-6" />
              <p className="text-sm text-white/80">
                New browsers stay pending until an approved device allows them
                in or recovery is confirmed.
              </p>
            </div>
          </div>
          <div className="p-6 md:p-10">
            <CardHeader className="px-0">
              <CardTitle>Log in</CardTitle>
              <CardDescription>
                Sign in with your account email and master password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register('email')} />
                  <p className="text-xs text-red-600">
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
                  <p className="text-xs text-red-600">
                    {form.formState.errors.password?.message}
                  </p>
                </div>
                {errorMessage ? (
                  <p className="rounded-[var(--radius-md)] bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </p>
                ) : null}
                <Button className="w-full" disabled={isBusy} type="submit">
                  {isBusy ? 'Starting login...' : 'Continue'}
                </Button>
              </form>
              <p className="mt-6 text-sm text-[color:var(--color-muted)]">
                New here?{' '}
                <Link className="font-semibold text-[color:var(--color-primary)]" to="/register">
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
