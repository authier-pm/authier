import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { IoWarningOutline } from 'react-icons/io5'
import { Button } from '@src/components/ui/button'
import { useAppToast } from '@src/ExtensionProviders'
import { cn } from '@src/lib/cn'
import type {
  LoginSessionSnapshot,
  MasterDeviceResetResult
} from '@src/background/loginSessionTypes'

type LoginAwaitingApprovalProps = {
  compact: boolean
  session: LoginSessionSnapshot
  resetLogin: () => Promise<void>
  initiateMasterDeviceReset: () => Promise<MasterDeviceResetResult>
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : t`Failed to schedule master device reset`

export const LoginAwaitingApproval = ({
  compact,
  session,
  resetLogin,
  initiateMasterDeviceReset
}: LoginAwaitingApprovalProps) => {
  const [resetMasterDeviceLoading, setResetMasterDeviceLoading] =
    useState(false)
  const toast = useAppToast()
  const challenge = session.challenge

  if (!challenge || session.status === 'completing') {
    return (
      <div className="extension-surface flex min-h-[220px] w-full max-w-[350px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] px-4 text-center shadow-lg">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
        <div className="text-sm text-[color:var(--color-muted)]">
          {session.status === 'completing' ? (
            <Trans>Finishing login…</Trans>
          ) : (
            <Trans>Checking device approval…</Trans>
          )}
        </div>
        <div className="max-w-full break-words text-xs text-[color:var(--color-muted)]">
          {session.email}
        </div>
        {session.error ? (
          <div className="text-sm text-[color:var(--color-danger)]">
            {session.error}
          </div>
        ) : null}
      </div>
    )
  }

  const pendingResetAt = challenge.masterDeviceResetProcessAt
  const confirmedResetAt = challenge.masterDeviceResetConfirmedAt
  const requestedResetAt = challenge.masterDeviceResetRequestedAt
  const rejectedResetAt = challenge.masterDeviceResetRejectedAt

  return (
    <div
      className={cn(
        'extension-surface w-full rounded-[var(--radius-lg)] border border-[color:var(--color-border)] shadow-lg',
        compact ? 'max-w-[350px] p-4' : 'max-w-[600px] p-5 sm:p-8'
      )}
    >
      <div className="mb-3 break-words text-sm font-semibold text-[color:var(--color-muted)]">
        <Trans>Username: {session.email}</Trans>
      </div>
      <div className="flex items-center gap-3">
        <IoWarningOutline className="size-8 shrink-0 text-amber-300" />
        <div>
          <div className="font-semibold text-[color:var(--color-foreground)]">
            <Trans>Device: </Trans>
          </div>
          <div className="break-words text-sm text-[color:var(--color-muted)]">
            {session.deviceName}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <p>
          <Trans>
            Approve this device in your device management in the vault on your
            master device in order to proceed adding new device.
          </Trans>
        </p>
        <p className="text-[color:var(--color-muted)]">
          {compact ? (
            <Trans>
              After you approve it, the vault password will be checked and your
              vault will open automatically in this popup.
            </Trans>
          ) : (
            <Trans>
              After you approve it, the vault password will be checked and your
              vault will open automatically in this tab.
            </Trans>
          )}
        </p>

        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
          <div>
            <Trans>
              Push notifications sent: {challenge.pushNotificationsSentCount}
            </Trans>
          </div>
          <div>
            <Trans>
              Push notifications failed:{' '}
              {challenge.pushNotificationsFailedCount}
            </Trans>
          </div>
        </div>

        {session.error ? (
          <div className="rounded-[var(--radius-md)] border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-amber-200">
            {session.error}
          </div>
        ) : null}

        {pendingResetAt ? (
          <p>
            <Trans>
              Master device reset scheduled for{' '}
              {new Date(pendingResetAt).toLocaleString()}.
            </Trans>
          </p>
        ) : null}

        {requestedResetAt && !confirmedResetAt && !rejectedResetAt ? (
          <p>
            <Trans>
              Master device reset confirmation email sent. Confirm the email
              link to arm the reset.
            </Trans>
          </p>
        ) : null}

        {rejectedResetAt ? (
          <p>
            <Trans>
              Master device reset was rejected at{' '}
              {new Date(rejectedResetAt).toLocaleString()}.
            </Trans>
          </p>
        ) : null}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            className="flex-1"
            disabled={
              Boolean(requestedResetAt && !rejectedResetAt) ||
              resetMasterDeviceLoading
            }
            onClick={() => {
              setResetMasterDeviceLoading(true)
              void initiateMasterDeviceReset()
                .then((result) => {
                  toast({
                    title: t`Master device reset confirmation email sent`,
                    description: `${t`After you confirm the email link, reset is scheduled for`} ${new Date(
                      result.processAt
                    ).toLocaleString()}`,
                    status: 'warning',
                    isClosable: true
                  })
                })
                .catch((error: unknown) => {
                  toast({
                    title: getErrorMessage(error),
                    status: 'error',
                    isClosable: true
                  })
                })
                .finally(() => {
                  setResetMasterDeviceLoading(false)
                })
            }}
            variant="destructive"
          >
            <Trans>Reset master device</Trans>
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              void resetLogin()
            }}
            variant="outline"
          >
            <Trans>Use a different account</Trans>
          </Button>
        </div>
      </div>
    </div>
  )
}
