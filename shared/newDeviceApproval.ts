export const newDeviceApprovalPolicies = [
  'EMAIL',
  'OTHER_DEVICE',
  'EMAIL_OR_OTHER_DEVICE',
  'EMAIL_AND_OTHER_DEVICE',
  'MASTER_DEVICE'
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
  policy === 'MASTER_DEVICE' ||
  policy === 'EMAIL_OR_OTHER_DEVICE' ||
  policy === 'EMAIL_AND_OTHER_DEVICE'

export const canDeviceApproveNewLogin = (
  policy: NewDeviceApprovalPolicy | null,
  deviceId: string | null | undefined,
  masterDeviceId: string | null | undefined
) =>
  Boolean(deviceId) &&
  allowsDeviceApproval(policy) &&
  (policy !== 'MASTER_DEVICE' || deviceId === masterDeviceId)

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
