import { useContext, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'
import { CopyIcon, EditIcon, ViewIcon, ViewOffIcon } from '@src/components/ui/icons'
import { Button, buttonVariants } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { DeleteSecretButton } from './DeleteSecretButton'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { pathNameToTypes, type ILoginSecret, type ITOTPSecret } from '@src/util/useDeviceState'
import { useAppToast } from '@src/ExtensionProviders'
import { cn } from '@src/lib/cn'
import {
  getMaskedSecretValue,
  getSecretCopyValue,
  getSecretLabel,
  getSecretUrl,
  getSecretUsername,
  getSecretValue,
  isTotpSecret
} from './secretUtils'
import { useElementSize, useVirtualWindow } from './useVirtualWindow'

const tableGridStyle = {
  gridTemplateColumns:
    '40px minmax(240px, 1.4fr) minmax(220px, 1.2fr) minmax(200px, 1fr) minmax(220px, 1fr) 168px'
} as const

const tableGridClassName = 'grid min-w-[1128px] gap-4 px-4'
const TABLE_ROW_HEIGHT = 76
const TABLE_HEADER_HEIGHT = 56

export function TableList({ filter }: { filter: string }) {
  const { selectedItems, setSelectedItems, searchSecrets } =
    useContext(DeviceStateContext)
  const pathname = useLocation().pathname as '/credentials' | '/totps' | '/'
  const debouncedSearchTerm = useDebounce(filter, 400)
  const data = useMemo(
    () => searchSecrets(debouncedSearchTerm, pathNameToTypes[pathname]),
    [debouncedSearchTerm, pathname, searchSecrets]
  )
  const showBulkActions = selectedItems.length > 0
  const [showAllSecrets, setShowAllSecrets] = useState(false)
  const parentRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const { height: containerHeight } = useElementSize(parentRef)
  const bodyViewportHeight = Math.max(containerHeight - TABLE_HEADER_HEIGHT, 0)
  const virtualWindow = useVirtualWindow({
    itemCount: data.length,
    itemSize: TABLE_ROW_HEIGHT,
    overscan: 10,
    scrollOffset: Math.max(scrollTop - TABLE_HEADER_HEIGHT, 0),
    viewportSize: bodyViewportHeight
  })

  const handleSelect = (secret: ILoginSecret | ITOTPSecret) => {
    if (selectedItems.includes(secret)) {
      setSelectedItems(selectedItems.filter((item) => item !== secret))
      return
    }

    setSelectedItems([...selectedItems, secret])
  }

  if (data.length === 0) {
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-muted)]">
            {showBulkActions
              ? `${selectedItems.length} selected`
              : `${data.length} results`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label={
                showAllSecrets ? t`Hide all secrets` : t`Show all secrets`
              }
              onClick={() => setShowAllSecrets((currentValue) => !currentValue)}
              size="sm"
              variant="outline"
            >
              {showAllSecrets ? (
                <ViewOffIcon boxSize={16} />
              ) : (
                <ViewIcon boxSize={16} />
              )}
              {showAllSecrets ? (
                <Trans>Hide secrets</Trans>
              ) : (
                <Trans>Show secrets</Trans>
              )}
            </Button>
            {showBulkActions ? (
              <DeleteSecretButton secrets={[...selectedItems]} size="sm">
                <Trans>Delete selected</Trans>
              </DeleteSecretButton>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="extension-scrollbar min-h-0 flex-1 overflow-auto"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop)
        }}
        ref={parentRef}
      >
        <div className="min-w-[1128px]">
          <div
            className={cn(
              tableGridClassName,
              'sticky top-0 z-10 h-14 items-center border-b border-[color:var(--color-border)] bg-[color:var(--color-card)]/95 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted)] uppercase backdrop-blur'
            )}
            style={tableGridStyle}
          >
            <div />
            <div>
              <Trans>Label</Trans>
            </div>
            <div>
              <Trans>URL</Trans>
            </div>
            <div>
              <Trans>Username</Trans>
            </div>
            <div>
              <Trans>Secret</Trans>
            </div>
            <div className="text-right">
              <Trans>Actions</Trans>
            </div>
          </div>

          <div
            className="relative min-w-[1128px]"
            style={{ height: `${virtualWindow.totalSize}px` }}
          >
            {data
              .slice(virtualWindow.startIndex, virtualWindow.endIndex + 1)
              .map((row, offsetIndex) => {
                const rowIndex = virtualWindow.startIndex + offsetIndex

                return (
                  <div
                    className="absolute left-0 top-0 w-full"
                    key={row.id}
                    style={{
                      height: `${TABLE_ROW_HEIGHT}px`,
                      transform: `translateY(${rowIndex * TABLE_ROW_HEIGHT}px)`
                    }}
                  >
                    <SecretTableRow
                      isBulkMode={showBulkActions}
                      isSelected={selectedItems.includes(row)}
                      onSelect={() => handleSelect(row)}
                      row={row}
                      showAllSecrets={showAllSecrets}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecretTableRow({
  row,
  isSelected,
  onSelect,
  showAllSecrets,
  isBulkMode
}: {
  row: ILoginSecret | ITOTPSecret
  isSelected: boolean
  onSelect: () => void
  showAllSecrets: boolean
  isBulkMode: boolean
}) {
  const [isSecretVisible, setIsSecretVisible] = useState(false)
  const toast = useAppToast()
  const secretUrl = getSecretUrl(row)
  const username = getSecretUsername(row)
  const isTotp = isTotpSecret(row)
  const renderedSecret =
    isSecretVisible || showAllSecrets
      ? getSecretValue(row)
      : getMaskedSecretValue(row)

  return (
    <div
      className={cn(
        tableGridClassName,
        'h-full items-center border-b border-[color:var(--color-border)]/70 py-3 transition',
        isSelected
          ? 'bg-[color:var(--color-accent)]/60'
          : 'hover:bg-[color:var(--color-accent)]/35'
      )}
      style={tableGridStyle}
    >
      <div className="flex items-center justify-center">
        <input
          checked={isSelected}
          className="size-4 rounded border border-[color:var(--color-border)] accent-[color:var(--color-primary)]"
          onChange={onSelect}
          type="checkbox"
        />
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
          {getSecretLabel(row)}
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-muted)]">
          {isTotp ? 'TOTP' : 'Credential'}
        </div>
      </div>

      <div className="truncate text-sm text-[color:var(--color-muted)]">
        {secretUrl || '—'}
      </div>

      <div className="truncate text-sm text-[color:var(--color-foreground)]">
        {username || '—'}
      </div>

      <div className="truncate font-mono text-sm text-[color:var(--color-foreground)]">
        {renderedSecret}
      </div>

      <div className="flex items-center justify-end gap-1">
        <Tooltip content={isTotp ? t`Copy token` : t`Copy`}>
          <Button
            aria-label={isTotp ? t`Copy token` : t`Copy`}
            onClick={async () => {
              await navigator.clipboard.writeText(getSecretCopyValue(row))
              toast({
                title: t`Copied to clipboard`,
                status: 'success'
              })
            }}
            size="icon"
            variant="ghost"
          >
            <CopyIcon boxSize={16} />
          </Button>
        </Tooltip>

        <Tooltip
          content={
            isSecretVisible || showAllSecrets ? t`Hide secret` : t`Show secret`
          }
        >
          <Button
            aria-label={
              isSecretVisible || showAllSecrets
                ? t`Hide secret`
                : t`Show secret`
            }
            onClick={() => {
              setIsSecretVisible((currentValue) => !currentValue)
            }}
            size="icon"
            variant="ghost"
          >
            {isSecretVisible || showAllSecrets ? (
              <ViewOffIcon boxSize={16} />
            ) : (
              <ViewIcon boxSize={16} />
            )}
          </Button>
        </Tooltip>

        <Tooltip content={t`Edit`}>
          <Link
            className={buttonVariants({ size: 'icon', variant: 'ghost' })}
            state={{
              data: isTotp ? row.totp : row.loginCredentials
            }}
            to={{
              pathname: `/secret/${row.id}`
            }}
          >
            <EditIcon boxSize={16} />
          </Link>
        </Tooltip>

        {isBulkMode ? null : (
          <DeleteSecretButton secrets={[row]} size="icon" />
        )}
      </div>
    </div>
  )
}
