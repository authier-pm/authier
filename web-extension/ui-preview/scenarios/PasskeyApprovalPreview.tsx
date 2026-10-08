import { PasskeyApproval } from '@src/passkeys/PasskeyApproval'
import type { PasskeyApprovalView } from '@src/passkeys/passkeyApprovalTypes'

const signingIn =
  new URLSearchParams(location.search).get('operation') === 'get'
const view: PasskeyApprovalView = {
  token: '00000000-0000-4000-8000-000000000001',
  operation: signingIn ? 'get' : 'create',
  origin: 'https://github.com',
  rpId: 'github.com',
  accountName: 'alex@example.com',
  verified: !signingIn && new URLSearchParams(location.search).has('unlocked'),
  accounts: []
}

export function PasskeyApprovalPreview() {
  return (
    <PasskeyApproval
      initialView={view}
      onAction={async (action) => {
        if (action.kind === 'authierPasskeyVerify')
          return {
            status: 'ready',
            view: {
              ...view,
              verified: true,
              accounts: [
                {
                  credentialId: 'personal',
                  userName: 'alex@example.com',
                  userDisplayName: 'Alex Morgan'
                },
                {
                  credentialId: 'work',
                  userName: 'alex@work.example',
                  userDisplayName: 'Alex at work'
                }
              ]
            }
          }
        return { status: 'done' }
      }}
    />
  )
}
