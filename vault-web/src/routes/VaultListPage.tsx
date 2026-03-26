import { File } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { constructURL } from '@shared/urlUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useVaultSession } from '@/providers/VaultSessionProvider'

type FilterMode = 'ALL' | 'LOGIN_CREDENTIALS' | 'TOTP'

type VaultListPageProps = {
  initialFilterMode?: FilterMode
}

export function VaultListPage({
  initialFilterMode = 'ALL'
}: VaultListPageProps) {
  const { decryptedSecrets, skippedSecretsCount } = useVaultSession()
  const [query, setQuery] = useState('')
  const filterMode = initialFilterMode

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
      <Card className="sticky top-4 z-20 lg:top-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              className="max-w-xl"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by label, URL, username, password, or TOTP secret"
              value={query}
            />
            <div className="flex gap-2">
              <Button asChild variant={filterMode === 'ALL' ? 'primary' : 'outline'}>
                <Link to="/vault">All</Link>
              </Button>
              <Button
                asChild
                variant={filterMode === 'LOGIN_CREDENTIALS' ? 'primary' : 'outline'}
              >
                <Link to="/vault/passwords">Passwords</Link>
              </Button>
              <Button asChild variant={filterMode === 'TOTP' ? 'primary' : 'outline'}>
                <Link to="/vault/totp">TOTP</Link>
              </Button>
            </div>
          </div>
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
          const iconUrl =
            secret.kind === 'LOGIN_CREDENTIALS'
              ? secret.loginCredentials.iconUrl
              : secret.totp.iconUrl
          const url =
            secret.kind === 'LOGIN_CREDENTIALS'
              ? secret.loginCredentials.url
              : secret.totp.url
          const subtitle =
            secret.kind === 'LOGIN_CREDENTIALS'
              ? `${secret.loginCredentials.username} at ${secret.loginCredentials.url}`
              : secret.totp.url ?? 'No linked website'

          return (
            <Link className="block w-full" key={secret.id} to={`/vault/${secret.id}`}>
              <Card className="w-full transition hover:-translate-y-0.5 hover:border-[color:var(--color-primary)]">
                <CardContent className="flex w-full min-w-0 items-center justify-between gap-4 p-5 max-md:flex-col max-md:items-start">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <VaultSecretIcon iconUrl={iconUrl} label={title} url={url} />
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

type VaultSecretIconProps = {
  iconUrl: string | null
  label: string
  url?: string | null
}

function VaultSecretIcon({
  iconUrl,
  label,
  url
}: VaultSecretIconProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const resolvedIconUrl = useMemo(() => {
    if (iconUrl) {
      return iconUrl
    }

    if (!url) {
      return null
    }

    const hostname = constructURL(url).hostname
    if (!hostname) {
      return null
    }

    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
  }, [iconUrl, url])

  if (!resolvedIconUrl || hasImageError) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-muted)]">
        <File className="size-4" />
      </div>
    )
  }

  return (
    <img
      alt={`${label} favicon`}
      className="size-10 shrink-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] object-cover"
      onError={() => setHasImageError(true)}
      src={resolvedIconUrl}
    />
  )
}
