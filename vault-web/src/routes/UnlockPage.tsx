import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
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

const unlockSchema = z.object({
  password: z.string().min(1)
})

export function UnlockPage() {
  const navigate = useNavigate()
  const { isBusy, lockedState, status, unlockVault, logout } = useVaultSession()
  const form = useForm<z.infer<typeof unlockSchema>>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      password: ''
    }
  })

  if (status === 'authenticated') {
    return <Navigate to="/vault" replace />
  }

  if (!lockedState) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    try {
      await unlockVault(password)
      navigate('/vault', { replace: true })
    } catch (error) {
      form.setError('password', {
        message:
          error instanceof Error ? error.message : 'Unable to unlock vault'
      })
    }
  })

  return (
    <div className="vault-grid flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.24em] text-[color:var(--color-muted)] uppercase">
            Vault locked
          </div>
          <CardTitle className="pt-3 text-2xl">Unlock vault</CardTitle>
          <CardDescription>
            Re-enter your master password to decrypt this local session.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
              Current session
            </p>
            <p className="mt-2 text-sm font-medium">{lockedState.email}</p>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {lockedState.deviceName}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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

            <Button
              className="w-full"
              disabled={isBusy}
              type="submit"
              variant="outline"
            >
              {isBusy ? 'Unlocking...' : 'Unlock'}
            </Button>
            <Button
              className="w-full"
              onClick={() => void logout()}
              type="button"
              variant="ghost"
            >
              Forget this device
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
