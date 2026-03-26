import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
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
      <Card className="w-full max-w-2xl border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.24em] text-[color:var(--color-muted)] uppercase">
            Waiting for approval
          </div>
          <CardTitle className="pt-3 text-2xl">
            Approve this browser from a trusted device
          </CardTitle>
          <CardDescription>
            {pendingLogin.email} is trying to access the vault from this
            browser.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--color-muted)]">
            As soon as one of your approved devices confirms this login, the web
            vault will finish the sign-in automatically.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
              <p className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
                Push notifications sent
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {pendingLogin.lastResult.pushNotificationsSentCount}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
              <p className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
                Push notifications failed
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {pendingLogin.lastResult.pushNotificationsFailedCount}
              </p>
            </div>
          </div>

          {pendingLogin.lastResult.masterDeviceResetProcessAt ? (
            <p className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 text-sm text-[color:var(--color-foreground)]">
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
              size="sm"
              variant="outline"
            >
              {isRequestingReset
                ? 'Scheduling recovery...'
                : 'I no longer have an approved device'}
            </Button>
          )}

          {errorMessage ? (
            <p className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-4 py-3 text-sm text-[color:var(--color-danger-foreground)]">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
