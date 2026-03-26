import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useVaultSession } from '@/providers/VaultSessionProvider'

type FilterMode = 'ALL' | 'LOGIN_CREDENTIALS' | 'TOTP'

export function VaultListPage() {
  const { decryptedSecrets, skippedSecretsCount } = useVaultSession()
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL')

  const visibleSecrets = decryptedSecrets.filter((secret) => {
    if (filterMode !== 'ALL' && secret.kind !== filterMode) {
      return false
    }

    const haystack =
      secret.kind === 'LOGIN_CREDENTIALS'
        ? `${secret.loginCredentials.label} ${secret.loginCredentials.url} ${secret.loginCredentials.username} ${secret.loginCredentials.password}`
        : `${secret.totp.label} ${secret.totp.url ?? ''} ${secret.totp.secret}`

    return haystack.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vault</CardTitle>
          <CardDescription>
            Search, review, and edit your encrypted credentials and TOTP seeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              className="max-w-xl"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by label, URL, username, password, or TOTP secret"
              value={query}
            />
            <div className="flex gap-2">
              {(['ALL', 'LOGIN_CREDENTIALS', 'TOTP'] as const).map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  type="button"
                  variant={filterMode === mode ? 'primary' : 'outline'}
                >
                  {mode === 'ALL'
                    ? 'All'
                    : mode === 'LOGIN_CREDENTIALS'
                      ? 'Passwords'
                      : 'TOTP'}
                </Button>
              ))}
            </div>
          </div>
          <Button asChild>
            <Link to="/vault/new">Add item</Link>
          </Button>
        </CardContent>
      </Card>
      {skippedSecretsCount > 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-muted)]">
            Skipped {skippedSecretsCount} secret
            {skippedSecretsCount === 1 ? '' : 's'} that could not be decoded by
            this web vault build.
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-1 gap-4">
        {visibleSecrets.map((secret) => {
          const title =
            secret.kind === 'LOGIN_CREDENTIALS'
              ? secret.loginCredentials.label
              : secret.totp.label
          const subtitle =
            secret.kind === 'LOGIN_CREDENTIALS'
              ? `${secret.loginCredentials.username} at ${secret.loginCredentials.url}`
              : secret.totp.url ?? 'No linked website'

          return (
            <Link className="block w-full" key={secret.id} to={`/vault/${secret.id}`}>
              <Card className="w-full transition hover:-translate-y-0.5 hover:border-[color:var(--color-primary)]">
                <CardContent className="flex w-full min-w-0 items-center justify-between gap-4 p-5 max-md:flex-col max-md:items-start">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex min-w-0 items-center gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-lg font-semibold" title={title}>
                        {title}
                      </h3>
                      <Badge className="shrink-0">
                        {secret.kind === 'LOGIN_CREDENTIALS' ? 'Password' : 'TOTP'}
                      </Badge>
                    </div>
                    <p
                      className="truncate text-sm text-[color:var(--color-muted)]"
                      title={subtitle}
                    >
                      {subtitle}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                    {new Date(secret.updatedAt ?? secret.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {visibleSecrets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm text-[color:var(--color-muted)]">
              No secrets match the current filter.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
