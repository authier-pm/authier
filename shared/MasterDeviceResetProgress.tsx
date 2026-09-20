export type ResetProgressStatus = {
  requiredApprovals: number
  approvalCount: number
  expiresAt?: string
  processAt: string
  confirmedAt?: string | null
  completedAt?: string | null
  rejectedAt?: string | null
}

export function MasterDeviceResetProgress({
  status
}: {
  status?: ResetProgressStatus | null
}) {
  if (!status) return null
  let message =
    'Confirm the link in your account email to start the waiting period.'
  if (isResetConfirmationExpired(status))
    message = 'The confirmation link expired. Request a new reset to continue.'
  if (status.confirmedAt)
    message = `Can complete after ${new Date(status.processAt).toLocaleString()}, once all approvals are received.`
  if (status.completedAt)
    message =
      'Reset complete. Log in with your vault password to set up a new master device.'
  if (status.rejectedAt)
    message =
      'This reset was cancelled. Your master device has not been removed.'
  return (
    <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
      <p className="font-semibold">Master device reset</p>
      <p className="mt-1">
        {status.approvalCount} of {status.requiredApprovals} other device
        approvals
      </p>
      <p className="mt-2 text-[color:var(--color-muted)]">{message}</p>
    </div>
  )
}

export const isResetConfirmationExpired = (
  status?: ResetProgressStatus | null
) =>
  Boolean(
    status?.expiresAt &&
    !status.confirmedAt &&
    new Date(status.expiresAt).getTime() <= Date.now()
  )
