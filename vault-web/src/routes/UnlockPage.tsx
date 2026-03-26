import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Unlock vault</CardTitle>
          <CardDescription>
            {lockedState.email} on {lockedState.deviceName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <Button className="w-full" disabled={isBusy} type="submit">
              {isBusy ? 'Unlocking...' : 'Unlock'}
            </Button>
            <Button
              className="w-full"
              onClick={() => void logout()}
              type="button"
              variant="outline"
            >
              Forget this device
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
