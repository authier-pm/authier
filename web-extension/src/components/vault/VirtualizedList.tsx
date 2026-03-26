import { useContext, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import browser from 'webextension-polyfill'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'
import { FiExternalLink } from 'react-icons/fi'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { Button, buttonVariants } from '@src/components/ui/button'
import { Card, CardContent } from '@src/components/ui/card'
import { Tooltip } from '@src/components/ui/tooltip'
import { useAppToast } from '@src/ExtensionProviders'
import { pathNameToTypes, type ILoginSecret, type ITOTPSecret } from '@src/util/useDeviceState'
import { CopyIcon, EditIcon, ViewIcon, ViewOffIcon } from '@src/components/ui/icons'
import {
  getMaskedSecretValue,
  getNavigableSecretUrl,
  getSecretCopyValue,
  getSecretKindLabel,
  getSecretLabel,
  getSecretUrl,
  getSecretUsername,
  getSecretValue,
  isTotpSecret
} from './secretUtils'
import { useElementSize, useVirtualWindow } from './useVirtualWindow'

const CARD_GAP = 16
const CARD_MIN_WIDTH = 280
const CARD_ROW_HEIGHT = 320

export const VirtualizedList = ({ filter }: { filter: string }) => {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets } = useContext(DeviceStateContext)
  const pathname = useLocation().pathname as '/credentials' | '/totps' | '/'
  const filteredItems = useMemo(
    () => searchSecrets(debouncedSearchTerm, pathNameToTypes[pathname]),
    [debouncedSearchTerm, pathname, searchSecrets]
  )
  const parentRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const { height: containerHeight, width: containerWidth } =
    useElementSize(parentRef)

  const columnCount = Math.max(
    1,
    Math.floor(
      (Math.max(containerWidth, CARD_MIN_WIDTH) + CARD_GAP) /
        (CARD_MIN_WIDTH + CARD_GAP)
    )
  )
  const cardWidth =
    containerWidth > 0
      ? (containerWidth - CARD_GAP * (columnCount - 1)) / columnCount
      : CARD_MIN_WIDTH
  const rowCount = Math.ceil(filteredItems.length / columnCount)

  const virtualWindow = useVirtualWindow({
    itemCount: rowCount,
    itemSize: CARD_ROW_HEIGHT,
    overscan: 4,
    scrollOffset: scrollTop,
    viewportSize: containerHeight
  })

  if (filteredItems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[color:var(--color-muted)]">
        <div>
          <div className="text-base font-medium text-[color:var(--color-foreground)]">
            <Trans>No secrets found</Trans>
          </div>
          <div className="mt-2">
            <Trans>Try a different search term or add a new item.</Trans>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="extension-scrollbar h-full min-h-0 overflow-auto p-4"
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop)
      }}
      ref={parentRef}
    >
      <div
        className="relative"
        style={{ height: `${virtualWindow.totalSize}px` }}
      >
        {Array.from(
          {
            length: Math.max(0, virtualWindow.endIndex - virtualWindow.startIndex + 1)
          },
          (_, offsetIndex) => {
            const rowIndex = virtualWindow.startIndex + offsetIndex
            const startIndex = rowIndex * columnCount
            const rowItems = filteredItems.slice(
              startIndex,
              startIndex + columnCount
            )

            return (
              <div
                className="absolute left-0 top-0 flex w-full gap-4"
                key={rowIndex}
                style={{
                  height: `${CARD_ROW_HEIGHT}px`,
                  transform: `translateY(${rowIndex * CARD_ROW_HEIGHT}px)`
                }}
              >
                {rowItems.map((secret) => (
                  <div key={secret.id} style={{ width: `${cardWidth}px` }}>
                    <VaultListCard secret={secret} />
                  </div>
                ))}
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

function VaultListCard({
  secret
}: {
  secret: ILoginSecret | ITOTPSecret
}) {
  const [isSecretVisible, setIsSecretVisible] = useState(false)
  const toast = useAppToast()
  const navigableUrl = getNavigableSecretUrl(secret)
  const secretUrl = getSecretUrl(secret)
  const username = getSecretUsername(secret)
  const isTotp = isTotpSecret(secret)
  const secretPreview = isSecretVisible
    ? getSecretValue(secret)
    : getMaskedSecretValue(secret)

  return (
    <Card className="group flex h-[304px] flex-col overflow-hidden border-white/10 bg-[color:var(--color-surface-muted)]">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-border)]/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--color-accent)]/70">
            <SecretItemIcon
              iconUrl={
                isTotp ? secret.totp.iconUrl : secret.loginCredentials.iconUrl
              }
              url={secretUrl}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium tracking-[0.2em] text-[color:var(--color-muted)] uppercase">
              {getSecretKindLabel(secret)}
            </div>
            <div className="truncate text-base font-semibold">
              {getSecretLabel(secret)}
            </div>
          </div>
        </div>
        <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
          {getSecretKindLabel(secret)}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <SecretMetaBlock label={t`Username`} value={username || '—'} />
        <SecretMetaBlock label={t`URL`} value={secretUrl || '—'} />
        <SecretMetaBlock
          label={isTotp ? t`Shared secret` : t`Password`}
          mono
          value={secretPreview}
        />

        <div className="mt-auto flex flex-wrap gap-2">
          <Tooltip content={isTotp ? t`Copy token` : t`Copy`}>
            <Button
              aria-label={isTotp ? t`Copy token` : t`Copy`}
              onClick={async () => {
                await navigator.clipboard.writeText(getSecretCopyValue(secret))
                toast({
                  title: t`Copied to clipboard`,
                  status: 'success'
                })
              }}
              size="sm"
              variant="outline"
            >
              <CopyIcon boxSize={16} />
              <Trans>Copy</Trans>
            </Button>
          </Tooltip>

          <Button
            aria-label={isSecretVisible ? t`Hide secret` : t`Show secret`}
            onClick={() => {
              setIsSecretVisible((currentValue) => !currentValue)
            }}
            size="sm"
            variant="ghost"
          >
            {isSecretVisible ? (
              <ViewOffIcon boxSize={16} />
            ) : (
              <ViewIcon boxSize={16} />
            )}
            {isSecretVisible ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
          </Button>

          <Link
            className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            state={{
              data: isTotp ? secret.totp : secret.loginCredentials
            }}
            to={{
              pathname: `/secret/${secret.id}`
            }}
          >
            <EditIcon boxSize={16} />
            <Trans>Edit</Trans>
          </Link>

          {navigableUrl ? (
            <Button
              aria-label={t`Open website`}
              onClick={async () => {
                await browser.tabs.create({ url: navigableUrl })
              }}
              size="sm"
              variant="ghost"
            >
              <FiExternalLink className="size-4" />
              <Trans>Open</Trans>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SecretMetaBlock({
  label,
  value,
  mono = false
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        {label}
      </div>
      <div
        className={
          mono
            ? 'truncate font-mono text-sm text-[color:var(--color-foreground)]'
            : 'truncate text-sm text-[color:var(--color-foreground)]'
        }
      >
        {value}
      </div>
    </div>
  )
}
