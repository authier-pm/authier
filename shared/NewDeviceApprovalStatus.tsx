import {
  allowsDeviceApproval,
  allowsEmailApproval,
  requiresBothApprovals,
  type NewDeviceApprovalPolicy
} from './newDeviceApproval'

type Props = {
  policy: NewDeviceApprovalPolicy
  email: string
  emailApprovalSentAt?: string | null
  emailApprovedAt?: string | null
  deviceApprovedAt?: string | null
}

export function NewDeviceApprovalStatus({
  policy,
  email,
  emailApprovalSentAt,
  emailApprovedAt,
  deviceApprovedAt
}: Props) {
  return (
    <div className="space-y-3 text-sm" aria-live="polite">
      <p>
        {requiresBothApprovals(policy)
          ? 'This login needs both email approval and approval from another Authier device.'
          : 'Approve this login using one of your selected methods.'}
      </p>
      {allowsEmailApproval(policy) && (
        <div className="rounded-xl border border-[color:var(--color-border)] p-3">
          <p className="font-semibold">
            {emailApprovedAt ? 'Email approved' : 'Check your email'}
          </p>
          {!emailApprovedAt && (
            <p className="mt-1 break-words text-[color:var(--color-muted)]">
              {emailApprovalSentAt
                ? `We sent an approval link to ${email}. Open it and confirm this login.`
                : `An approval email will be sent to ${email}. Keep this page open.`}
            </p>
          )}
        </div>
      )}
      {allowsDeviceApproval(policy) && (
        <div className="rounded-xl border border-[color:var(--color-border)] p-3">
          <p className="font-semibold">
            {deviceApprovedAt
              ? 'Authier device approved'
              : 'Approve from another Authier device'}
          </p>
          {!deviceApprovedAt && (
            <p className="mt-1 text-[color:var(--color-muted)]">
              Open Devices in a vault that is already signed in and approve this
              request.
            </p>
          )}
        </div>
      )}
      <p className="text-[color:var(--color-muted)]">
        After approval, your master password will be checked and the vault will
        open automatically.
      </p>
    </div>
  )
}

export function NewDeviceApprovalProgress({
  policy,
  emailApprovedAt,
  deviceApprovedAt
}: Pick<Props, 'policy' | 'emailApprovedAt' | 'deviceApprovedAt'>) {
  if (!requiresBothApprovals(policy)) return null
  return (
    <p className="text-sm text-[color:var(--color-muted)]" aria-live="polite">
      Email: {emailApprovedAt ? 'approved' : 'waiting'} · Authier device:{' '}
      {deviceApprovedAt ? 'approved' : 'waiting'}
    </p>
  )
}
