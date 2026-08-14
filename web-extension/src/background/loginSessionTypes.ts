export const LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL = 6000

export type LoginSessionStatus = 'editing' | 'awaiting-approval' | 'completing'

export type LoginApprovalChallenge = {
  type: 'awaiting-approval'
  id: number
  pushNotificationsSentCount: number
  pushNotificationsFailedCount: number
  masterDeviceResetRequestedAt: string | null
  masterDeviceResetProcessAt: string | null
  masterDeviceResetConfirmedAt: string | null
  masterDeviceResetRejectedAt: string | null
}

export type LoginApprovedChallenge = {
  type: 'approved'
  id: number
  addDeviceSecretEncrypted: string
  encryptionSalt: string
  userId: string
  approvedAt: string | null
}

export type LoginChallenge = LoginApprovalChallenge | LoginApprovedChallenge

export type LoginSessionSnapshot = {
  attemptId: string | null
  email: string
  password: string
  deviceName: string
  status: LoginSessionStatus
  challenge: LoginApprovalChallenge | null
  error: string | null
}

export type LoginDraft = Pick<LoginSessionSnapshot, 'email' | 'password'>

export type MasterDeviceResetResult = {
  requestedAt: string
  processAt: string
  alreadyPending: boolean
}
