import { Link, useNavigate } from 'react-router-dom'
import type { DecryptedVaultSecret } from '@/lib/vaultSecrets'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useVaultSession } from '@/providers/VaultSessionProvider'

export const PasskeyDetail = ({
  secret
}: {
  secret: Extract<DecryptedVaultSecret, { kind: 'PASSKEY' }>
}) => {
  const { deleteSecret } = useVaultSession()
  const navigate = useNavigate()
  return (
    <Card>
      <CardHeader>
        <p className="text-xs uppercase tracking-widest">Passkey</p>
        <CardTitle>{secret.passkey.label}</CardTitle>
        <CardDescription>
          Use this passkey with the Authier extension in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[color:var(--color-muted)]">Website</dt>
            <dd>{secret.passkey.rpId}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--color-muted)]">Account</dt>
            <dd>{secret.passkey.userName}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--color-muted)]">Name</dt>
            <dd>{secret.passkey.userDisplayName}</dd>
          </div>
        </dl>
        <p className="text-sm text-[color:var(--color-muted)]">
          This passkey is encrypted in your vault and syncs to your connected
          browsers. Authier asks you to approve each sign-in.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/vault">Back to vault</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (
                !window.confirm(
                  'Delete this passkey from your Authier vault? You may need another sign-in method to access this website.'
                )
              )
                return
              await deleteSecret(secret.id)
              navigate('/vault')
            }}
          >
            Delete passkey
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
