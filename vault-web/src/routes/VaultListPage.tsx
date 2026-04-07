import { File, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { constructURL } from '@shared/urlUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useVaultSession } from '@/providers/VaultSessionProvider'

type FilterMode = 'ALL' | 'LOGIN_CREDENTIALS' | 'TOTP'

type VaultListPageProps = {
  initialFilterMode?: FilterMode
}

const filterTabs: Array<{
  label: string
  path: string
  value: FilterMode
}> = [
    { label: 'All', path: '/vault', value: 'ALL' },
    { label: 'Passwords', path: '/vault/passwords', value: 'LOGIN_CREDENTIALS' },
    { label: 'TOTP', path: '/vault/totp', value: 'TOTP' }
  ]

const formatLastSyncLabel = (lastSyncAt: string | null | undefined) => {
  if (!lastSyncAt) {
    return 'Last synced: never'
  }

  const lastSyncDate = new Date(lastSyncAt)

  if (Number.isNaN(lastSyncDate.getTime())) {
    return 'Last synced: never'
  }

  return `Last synced: ${lastSyncDate.toLocaleString()}`
}

export function VaultListPage({
  initialFilterMode = 'ALL'
}: VaultListPageProps) {
  const {
    decryptedSecrets,
    isSyncingVault,
    session,
    skippedSecretsCount,
    syncVault
  } = useVaultSession()
  const [query, setQuery] = useState('')
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null)
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

  const visibleSecretCountLabel = `${visibleSecrets.length} ${visibleSecrets.length === 1 ? 'secret' : 'secrets'
    }`
  const lastSyncLabel = formatLastSyncLabel(session?.currentDevice.lastSyncAt)

  const handleSync = () => {
    void syncVault()
      .then(() => {
        setSyncErrorMessage(null)
      })
      .catch((error) => {
        setSyncErrorMessage(
          error instanceof Error ? error.message : 'Unable to sync vault'
        )
      })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-3xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                <Input
                  className="h-11 rounded-full bg-[color:var(--color-input)] pl-10 pr-11"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by label, URL, username, password, or TOTP secret"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
                    onClick={() => setQuery('')}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-2 text-sm font-medium">
                  {visibleSecretCountLabel}
                </div>
                {filterTabs.map((item) => (
                  <Button
                    asChild
                    className="rounded-full"
                    key={item.path}
                    size="sm"
                    variant={filterMode === item.value ? 'outline' : 'ghost'}
                  >
                    <Link to={item.path}>{item.label}</Link>
                  </Button>
                ))}
                <Button
                  disabled={isSyncingVault}
                  onClick={handleSync}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RefreshCw
                    className={isSyncingVault ? 'size-4 animate-spin' : 'size-4'}
                  />
                  {isSyncingVault ? 'Syncing...' : 'Sync now'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm text-[color:var(--color-muted)]">
              <p>{lastSyncLabel}</p>
              {syncErrorMessage ? (
                <p className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-4 py-3 text-sm text-[color:var(--color-danger-foreground)]">
                  {syncErrorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {skippedSecretsCount > 0 ? (
        <Card className="border-amber-400/30 bg-amber-500/10">
          <CardContent className="p-4 text-sm text-amber-200">
            Skipped {skippedSecretsCount} secret
            {skippedSecretsCount === 1 ? '' : 's'} that could not be decoded by
            this web vault build.
          </CardContent>
        </Card>
      ) : null}

      {visibleSecrets.length === 0 ? (
        <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
          <CardContent className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-[color:var(--color-muted)]">
            <div>
              <div className="text-base font-medium text-[color:var(--color-foreground)]">
                No secrets found
              </div>
              <div className="mt-2">
                Try a different search term or add a new item.
              </div>
            </div>
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

  const itemHeight = containerWidth >= 1024 ? 88 : 104
  const overscan = 6
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
  const endIndex = Math.min(secrets.length, startIndex + visibleCount)
  const totalHeight = secrets.length * itemHeight
  const resultCountLabel = `${secrets.length} ${secrets.length === 1 ? 'item' : 'items'}`

  return (
    <Card className="min-h-0 flex-1 overflow-hidden border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
      <CardContent className="flex h-full min-h-0 flex-col p-0">
        <div className="border-b border-[color:var(--color-border)] px-4 py-3 text-sm text-[color:var(--color-muted)]">
          {resultCountLabel}
          <Button asChild size="sm" className='ml-auto' variant="primary">
            <Link to="/vault/new">
              <Plus className="size-4" />
              Add item
            </Link>
          </Button>
        </div>
        <div
          className="extension-scrollbar min-h-0 flex-1 overflow-y-auto p-4"
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          ref={scrollContainerRef}
        >
          <div className="relative" style={{ height: totalHeight }}>
            {secrets.slice(startIndex, endIndex).map((secret, index) => {
              const itemIndex = startIndex + index

              return (
                <div
                  className="absolute inset-x-0 pb-4"
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
      </CardContent>
    </Card>
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
  const kindLabel = secret.kind === 'LOGIN_CREDENTIALS' ? 'Credential' : 'TOTP'

  return (
    <Link className="block w-full" to={`/vault/${secret.id}`}>
      <Card className="w-full border-white/10 bg-[color:var(--color-surface-muted)] transition hover:bg-[color:var(--color-accent)]/35">
        <CardContent className="flex w-full min-w-0 items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-accent)]/70">
            <VaultSecretIcon iconUrl={iconUrl} label={title} url={url} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium tracking-[0.2em] text-[color:var(--color-muted)] uppercase">
              {kindLabel}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-3 max-lg:flex-wrap">
              <h3 className="truncate text-base font-semibold" title={title}>
                {title}
              </h3>
              <p
                className="min-w-0 flex-1 truncate text-sm text-[color:var(--color-muted)]"
                title={subtitle}
              >
                {subtitle}
              </p>
              <div className="shrink-0 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1 text-[11px] font-medium tracking-[0.14em] text-[color:var(--color-muted)] uppercase">
                {new Date(secret.updatedAt ?? secret.createdAt).toLocaleDateString()}
              </div>
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
    return <File className="size-5 text-[color:var(--color-muted)]" />
  }

  return (
    <img
      alt={`${label} favicon`}
      className="size-8 rounded-md object-cover"
      onError={() => setHasImageError(true)}
      src={resolvedIconUrl}
    />
  )
}
