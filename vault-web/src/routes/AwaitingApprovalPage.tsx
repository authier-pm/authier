import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useVaultSession } from '@/providers/VaultSessionProvider'

export function AwaitingApprovalPage() {
  const navigate = useNavigate()
  const {
    pendingLogin,
    pollPendingLogin,
    requestMasterDeviceReset,
    status
  } = useVaultSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRequestingReset, setIsRequestingReset] = useState(false)

  useEffect(() => {
    if (!pendingLogin) {
      return
    }

    const intervalId = window.setInterval(() => {
      void pollPendingLogin()
        .then((result) => {
          if (result === 'authenticated') {
            navigate('/vault', { replace: true })
          }
        })
        .catch((error) => {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to refresh login'
          )
        })
    }, 6000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [navigate, pendingLogin, pollPendingLogin])

  if (status === 'authenticated') {
    return <Navigate to="/vault" replace />
  }

  if (!pendingLogin) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="vault-grid flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Waiting for device approval</CardTitle>
          <CardDescription>
            {pendingLogin.email} is trying to access the vault from this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--color-muted)]">
            Approve this browser from one of your trusted devices. As soon as it
            is approved, this page will finish the login automatically.
          </p>
          <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                Push notifications sent
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {pendingLogin.lastResult.pushNotificationsSentCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                Push notifications failed
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {pendingLogin.lastResult.pushNotificationsFailedCount}
              </p>
            </div>
          </div>
          {pendingLogin.lastResult.masterDeviceResetProcessAt ? (
            <p className="rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-4 py-3 text-sm text-[color:var(--color-foreground)]">
              Recovery is scheduled for{' '}
              {new Date(
                pendingLogin.lastResult.masterDeviceResetProcessAt
              ).toLocaleString()}
              .
            </p>
          ) : (
            <Button
              disabled={isRequestingReset}
              onClick={() => {
                setIsRequestingReset(true)
                void requestMasterDeviceReset(pendingLogin.lastResult.challengeId)
                  .catch((error) => {
                    setErrorMessage(
                      error instanceof Error
                        ? error.message
                        : 'Unable to schedule recovery'
                    )
                  })
                  .finally(() => {
                    setIsRequestingReset(false)
                  })
              }}
              variant="outline"
            >
              {isRequestingReset
                ? 'Scheduling recovery...'
                : 'I no longer have an approved device'}
            </Button>
          )}
          {errorMessage ? (
            <p className="rounded-[var(--radius-md)] bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
