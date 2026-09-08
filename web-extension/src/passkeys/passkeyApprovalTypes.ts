import type { PasskeyBridgeResponse } from './bridgeProtocol'

export type PasskeyOperation = 'create' | 'get'
export type PasskeyReply = PasskeyBridgeResponse

export interface PasskeyAccount {
  credentialId: string
  userName: string
  userDisplayName: string
}

// Only public metadata crosses into the approval window. Keys stay in the background.
export interface PasskeyApprovalView {
  token: string
  operation: PasskeyOperation
  origin: string
  rpId: string
  accountName?: string
  verified: boolean
  accounts: PasskeyAccount[]
}

export type PasskeyApprovalAction =
  | { kind: 'authierPasskeyView'; token: string }
  | { kind: 'authierPasskeyVerify'; token: string; password: string }
  | { kind: 'authierPasskeyApprove'; token: string; credentialId?: string }
  | { kind: 'authierPasskeyDismiss'; token: string; fallback: boolean }

export type PasskeyApprovalReply =
  | { status: 'ready'; view: PasskeyApprovalView }
  | { status: 'done' }
  | { status: 'error'; message: string }
