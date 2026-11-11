export const newDeviceApprovalPolicies = [
  'EMAIL',
  'OTHER_DEVICE',
  'EMAIL_OR_OTHER_DEVICE',
  'EMAIL_AND_OTHER_DEVICE'
] as const

export type NewDeviceApprovalPolicy = (typeof newDeviceApprovalPolicies)[number]

// Unconfigured accounts still require approval until the user chooses a policy.
export const allowsEmailApproval = (policy: NewDeviceApprovalPolicy | null) =>
  policy === null ||
  policy === 'EMAIL' ||
  policy === 'EMAIL_OR_OTHER_DEVICE' ||
  policy === 'EMAIL_AND_OTHER_DEVICE'

export const allowsDeviceApproval = (policy: NewDeviceApprovalPolicy | null) =>
  policy === 'OTHER_DEVICE' ||
  policy === 'EMAIL_OR_OTHER_DEVICE' ||
  policy === 'EMAIL_AND_OTHER_DEVICE'

export const requiresBothApprovals = (policy: NewDeviceApprovalPolicy | null) =>
  policy === 'EMAIL_AND_OTHER_DEVICE'

export const isNewDeviceApprovalComplete = (
  policy: NewDeviceApprovalPolicy | null,
  approvals: { emailApproved: boolean; deviceApproved: boolean }
) => {
  if (requiresBothApprovals(policy))
    return approvals.emailApproved && approvals.deviceApproved
  return (
    (allowsEmailApproval(policy) && approvals.emailApproved) ||
    (allowsDeviceApproval(policy) && approvals.deviceApproved)
  )
}
