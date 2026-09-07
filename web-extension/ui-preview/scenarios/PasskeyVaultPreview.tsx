import { PasskeyDetailCard } from '@src/components/vault/PasskeyDetailCard'
import { Button } from '@src/components/ui/button'

export const PasskeyVaultPreview = () => (
  <div className="min-h-screen p-8" data-ui-preview>
    <div className="mx-auto mb-6 max-w-2xl text-sm font-semibold tracking-widest text-[color:var(--color-primary)] uppercase">
      Authier / Your passkeys
    </div>
    <PasskeyDetailCard
      passkey={{
        label: 'GitHub',
        rpId: 'github.com',
        userName: 'alex@example.com',
        userDisplayName: 'Alex Morgan',
        createdAt: '2026-09-08T10:00:00.000Z'
      }}
    >
      <div className="flex justify-end">
        <Button variant="destructive">Delete passkey</Button>
      </div>
    </PasskeyDetailCard>
  </div>
)
