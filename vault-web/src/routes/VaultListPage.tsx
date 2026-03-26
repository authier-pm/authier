import { File } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
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
  const deferredQuery = useDeferredValue(query)
  const filterMode = initialFilterMode

  const visibleSecrets = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase()

    return decryptedSecrets.filter((secret) => {
      if (filterMode !== 'ALL' && secret.kind !== filterMode) {
        return false
      }

      const haystack =
        secret.kind === 'LOGIN_CREDENTIALS'
          ? `${secret.loginCredentials.label} ${secret.loginCredentials.url} ${secret.loginCredentials.username} ${secret.loginCredentials.password}`
          : `${secret.totp.label} ${secret.totp.url ?? ''} ${secret.totp.secret}`

      return haystack.toLowerCase().includes(normalizedQuery)
    })
  }, [decryptedSecrets, deferredQuery, filterMode])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <Card className="shrink-0">
        <CardContent className="p-5">
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
      {visibleSecrets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-sm text-[color:var(--color-muted)]">
            No secrets match the current filter.
          </CardContent>
        </Card>
      ) : (
        <VirtualizedSecretList secrets={visibleSecrets} />
      )}
    </div>
  )
}

type VirtualizedSecretListProps = {
  secrets: ReturnType<typeof useVaultSession>['decryptedSecrets']
}

function VirtualizedSecretList({
  secrets
}: VirtualizedSecretListProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(640)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const element = scrollContainerRef.current

    if (!element) {
      return
    }

    const updateSize = () => {
      setContainerHeight(element.clientHeight)
      setContainerWidth(element.clientWidth)
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const element = scrollContainerRef.current

    if (!element) {
      return
    }

    element.scrollTop = 0
    setScrollTop(0)
  }, [secrets])

  const itemHeight = containerWidth >= 1024 ? 72 : 96
  const overscan = 6
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
  const endIndex = Math.min(secrets.length, startIndex + visibleCount)
  const totalHeight = secrets.length * itemHeight

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-lg)] pr-3"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      ref={scrollContainerRef}
    >
      <div className="relative" style={{ height: totalHeight }}>
        {secrets.slice(startIndex, endIndex).map((secret, index) => {
          const itemIndex = startIndex + index

          return (
            <div
              className="absolute inset-x-0"
              key={secret.id}
              style={{
                top: itemIndex * itemHeight
              }}
            >
              <VaultSecretListItem secret={secret} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

type VaultSecretListItemProps = {
  secret: ReturnType<typeof useVaultSession>['decryptedSecrets'][number]
}

function VaultSecretListItem({
  secret
}: VaultSecretListItemProps) {
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
    <Link className="block w-full pb-3" to={`/vault/${secret.id}`}>
      <Card className="w-full transition hover:-translate-y-0.5 hover:border-[color:var(--color-primary)]">
        <CardContent className="flex w-full min-w-0 items-center gap-3 p-3 max-lg:flex-wrap">
          <VaultSecretIcon iconUrl={iconUrl} label={title} url={url} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3 max-lg:flex-wrap">
              <h3 className="truncate text-base font-semibold" title={title}>
                {title}
              </h3>
              <Badge className="shrink-0">
                {secret.kind === 'LOGIN_CREDENTIALS' ? 'Password' : 'TOTP'}
              </Badge>
              <p
                className="min-w-0 flex-1 truncate text-sm text-[color:var(--color-muted)]"
                title={subtitle}
              >
                {subtitle}
              </p>
              <p className="shrink-0 text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                {new Date(secret.updatedAt ?? secret.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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
