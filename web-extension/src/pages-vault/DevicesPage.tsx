import { useMemo, useState, type ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { formatDistance, intlFormat } from 'date-fns'
import {
  FiCheckCircle,
  FiEdit3,
  FiGlobe,
  FiKey,
  FiLock,
  FiLogOut,
  FiMonitor,
  FiSave,
  FiSearch,
  FiSettings,
  FiShield,
  FiStar,
  FiXCircle
} from 'react-icons/fi'
import {
  useChangeDeviceSettingsMutation,
  useChangeMasterDeviceMutation,
  useRenameDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import { DeviceQuery } from '@shared/generated/graphqlBaseTypes'
import { device } from '@src/background/ExtensionDevice'
import { DeviceDeleteAlert } from '@src/components/vault/DeviceDeleteAlert'
import { RefreshDeviceButton } from '@src/components/vault/RefreshDeviceButton'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { Input } from '@src/components/ui/input'
import { Switch } from '@src/components/ui/switch'
import { Tooltip } from '@src/components/ui/tooltip'
import { cn } from '@src/lib/cn'
import { useNavigate } from 'react-router-dom'
import { vaultLockTimeoutOptions } from '@shared/constants'
import { NewDevicesApprovalStack } from './NewDeviceApproval'
import {
  DevicesListWithDataDocument,
  useDevicesListWithDataQuery
} from './Devices.codegen'

type DeviceCardProps = {
  deviceInfo: Partial<DeviceQuery>
  masterDeviceId: string
}

type DeviceSortOption = 'createdAt' | 'lastSyncAt'

export function DevicesPage() {
  const { data, loading } = useDevicesListWithDataQuery()
  const [filterBy, setFilterBy] = useState('')
  const [sortBy, setSortBy] = useState<DeviceSortOption>('createdAt')

  const devices = data?.me?.devices ?? []
  const masterDeviceId = data?.me?.masterDeviceId ?? ''
  const currentDevice = devices.find((deviceInfo) => deviceInfo.id === device.id)
  const otherDevices = devices.filter((deviceInfo) => deviceInfo.id !== device.id)

  const filteredOtherDevices = useMemo(() => {
    const normalizedFilter = filterBy.trim().toLowerCase()

    const matchingDevices = !normalizedFilter
      ? otherDevices
      : otherDevices.filter((deviceInfo) => {
          return [
            deviceInfo.name,
            deviceInfo.lastIpAddress,
            deviceInfo.lastGeoLocation
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedFilter))
        })

    return [...matchingDevices].sort((left, right) => {
      const leftDate =
        sortBy === 'lastSyncAt'
          ? Date.parse(left.lastSyncAt ?? left.createdAt)
          : Date.parse(left.createdAt)
      const rightDate =
        sortBy === 'lastSyncAt'
          ? Date.parse(right.lastSyncAt ?? right.createdAt)
          : Date.parse(right.createdAt)

      return rightDate - leftDate
    })
  }, [filterBy, otherDevices, sortBy])

  return (
    <div className="extension-scrollbar mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 overflow-y-auto p-6 md:p-8">
      <section className="flex flex-col gap-3">
        <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
          <Trans>Devices</Trans>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
          Manage every device with one clear control surface
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)] md:text-base">
          Track active devices, review sync history, adjust lock settings, and
          approve or revoke access without leaving the vault.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(16,54,56,0.96)_0%,rgba(17,31,32,1)_75%)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
                  Device control
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--color-foreground)]">
                  {devices.length} {t`devices`}
                </div>
                <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                  {currentDevice?.name ?? 'Current device'} is this vault session.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <RefreshDeviceButton />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MetricChip
                icon={<FiMonitor className="size-4" />}
                label="Current"
                value={currentDevice?.name ?? 'Unknown'}
              />
              <MetricChip
                icon={<FiStar className="size-4" />}
                label="Master"
                value={
                  devices.find((deviceInfo) => deviceInfo.id === masterDeviceId)?.name ??
                  'Not found'
                }
              />
              <MetricChip
                icon={<FiShield className="size-4" />}
                label="Logged in"
                value={`${devices.filter((deviceInfo) => !deviceInfo.logoutAt).length}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Find a device fast</CardTitle>
            <CardDescription>
              Search by device name, IP address, or geolocation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
              <Input
                className="pl-9"
                onChange={(event) => {
                  setFilterBy(event.target.value)
                }}
                placeholder={t`Search for device`}
                value={filterBy}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InlineStat
                label="Active"
                value={`${devices.filter((deviceInfo) => !deviceInfo.logoutAt).length}`}
              />
              <InlineStat
                label="Shown"
                value={`${filteredOtherDevices.length + (currentDevice ? 1 : 0)}`}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <NewDevicesApprovalStack />

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
        </div>
      ) : (
        <div className="space-y-8">
          {currentDevice ? (
            <DeviceSection
              devices={[currentDevice]}
              emptyMessage="No active device session found."
              masterDeviceId={masterDeviceId}
              title="This device"
            />
          ) : null}

          <DeviceSection
            devices={filteredOtherDevices}
            emptyMessage="No other devices match this search."
            masterDeviceId={masterDeviceId}
            sortControl={
              <label className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
                <span>Sort by</span>
                <select
                  className="h-9 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                  onChange={(event) => {
                    setSortBy(event.target.value as DeviceSortOption)
                  }}
                  value={sortBy}
                >
                  <option value="createdAt">Date added</option>
                  <option value="lastSyncAt">Last synced</option>
                </select>
              </label>
            }
            title="Other devices"
          />
        </div>
      )}
    </div>
  )
}

function DeviceSection({
  devices,
  emptyMessage,
  masterDeviceId,
  sortControl,
  title
}: {
  devices: Partial<DeviceQuery>[]
  emptyMessage: string
  masterDeviceId: string
  sortControl?: ReactNode
  title: string
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-foreground)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {devices.length} shown
          </p>
        </div>
        {sortControl}
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-[color:var(--color-muted)]">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {devices.map((deviceInfo) => (
            <DeviceCard
              deviceInfo={deviceInfo}
              key={deviceInfo.id}
              masterDeviceId={masterDeviceId}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function DeviceCard({ deviceInfo, masterDeviceId }: DeviceCardProps) {
  const [changeMasterDeviceMutation] = useChangeMasterDeviceMutation()
  const [changeDeviceSettingsMutation] = useChangeDeviceSettingsMutation()
  const [renameDeviceMutation] = useRenameDeviceMutation()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [deviceName, setDeviceName] = useState(deviceInfo.name ?? '')
  const [lockTime, setLockTime] = useState(
    String(deviceInfo.vaultLockTimeoutSeconds ?? vaultLockTimeoutOptions[0]?.value ?? 0)
  )
  const [syncTOTP, setSyncTOTP] = useState(Boolean(deviceInfo.syncTOTP))
  const navigate = useNavigate()

  const isCurrentDevice = deviceInfo.id === device.id
  const isMasterDevice = deviceInfo.id === masterDeviceId
  const isLoggedOut = Boolean(deviceInfo.logoutAt)

  return (
    <>
      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(18,44,46,0.98)_0%,rgba(14,26,27,1)_100%)]">
        <CardContent className="p-0">
          <div className="border-b border-[color:var(--color-border)]/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-primary)]">
                  <FiMonitor className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {isCurrentDevice ? <StateBadge tone="primary">Current</StateBadge> : null}
                    {isMasterDevice ? <StateBadge tone="warning">Master</StateBadge> : null}
                    {isLoggedOut ? (
                      <StateBadge tone="danger">
                        <FiXCircle className="size-3.5" />
                        <Trans>Logged out</Trans>
                      </StateBadge>
                    ) : (
                      <StateBadge tone="success">
                        <FiCheckCircle className="size-3.5" />
                        <Trans>Logged in</Trans>
                      </StateBadge>
                    )}
                  </div>

                  {isRenameOpen ? (
                    <div className="mt-3 flex gap-2">
                      <Input
                        maxLength={128}
                        onChange={(event) => {
                          setDeviceName(event.target.value)
                        }}
                        value={deviceName}
                      />
                      <Button
                        onClick={async () => {
                          await renameDeviceMutation({
                            refetchQueries: [
                              {
                                query: DevicesListWithDataDocument
                              }
                            ],
                            variables: {
                              id: deviceInfo.id as string,
                              name: deviceName
                            }
                          })
                          setIsRenameOpen(false)
                        }}
                        size="icon"
                        variant="primary"
                      >
                        <FiSave className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="truncate text-xl font-semibold text-[color:var(--color-foreground)]">
                        {deviceInfo.name}
                      </div>
                      <button
                        className="mt-1 inline-flex items-center gap-2 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)]"
                        onClick={() => {
                          setIsRenameOpen(true)
                        }}
                        type="button"
                      >
                        <FiEdit3 className="size-4" />
                        Rename
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {!isMasterDevice ? (
                <Button
                  onClick={async () => {
                    await changeMasterDeviceMutation({
                      variables: {
                        newMasterDeviceId: deviceInfo.id as string
                      }
                    })
                  }}
                  size="sm"
                  variant="outline"
                >
                  <FiStar className="size-4" />
                  <Trans>Set as master device</Trans>
                </Button>
              ) : null}

              <Button
                onClick={() => {
                  if (isCurrentDevice) {
                    navigate('/settings/security')
                    return
                  }

                  setIsConfigOpen((currentValue) => !currentValue)
                }}
                size="sm"
                variant="ghost"
              >
                <FiSettings className="size-4" />
                {isCurrentDevice ? <Trans>Settings</Trans> : <Trans>Config</Trans>}
              </Button>

              <Button
                onClick={() => {
                  setIsDeleteOpen(true)
                }}
                size="sm"
                variant="ghost"
              >
                <FiLogOut className="size-4" />
                <Trans>Logout</Trans>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5">
            <MetaRow
              icon={<FiGlobe className="size-4" />}
              label={<Trans>Last IP Address</Trans>}
              value={deviceInfo.lastIpAddress ?? '—'}
            />
            <MetaRow
              icon={<FiSearch className="size-4" />}
              label={<Trans>Geolocation</Trans>}
              value={deviceInfo.lastGeoLocation ?? '—'}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateMeta
                date={deviceInfo.createdAt}
                label={<Trans>Added</Trans>}
              />
              <DateMeta
                date={deviceInfo.lastSyncAt}
                emptyLabel={<Trans>Never synced</Trans>}
                label={<Trans>Last sync</Trans>}
              />
            </div>
          </div>

          {isConfigOpen ? (
            <div className="border-t border-[color:var(--color-border)]/70 bg-black/10 p-5">
              <div className="grid gap-5">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[color:var(--color-foreground)]"
                    htmlFor={`lock-time-${deviceInfo.id}`}
                  >
                    <Trans>Lock time</Trans>
                  </label>
                  <select
                    className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                    id={`lock-time-${deviceInfo.id}`}
                    onChange={(event) => {
                      setLockTime(event.target.value)
                    }}
                    value={lockTime}
                  >
                    {vaultLockTimeoutOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                    <Trans>
                      Automatically locks vault after chosen period of time
                    </Trans>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-white/10 bg-[color:var(--color-card)]/70 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[color:var(--color-foreground)]">
                      2FA sync
                    </div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      Keep one-time password data synced to this device.
                    </div>
                  </div>
                  <Switch
                    checked={syncTOTP}
                    onCheckedChange={setSyncTOTP}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      await changeDeviceSettingsMutation({
                        refetchQueries: [
                          {
                            query: DevicesListWithDataDocument
                          }
                        ],
                        variables: {
                          id: deviceInfo.id as string,
                          syncTOTP,
                          vaultLockTimeoutSeconds: Number.parseInt(lockTime, 10)
                        }
                      })
                      setIsConfigOpen(false)
                    }}
                    variant="primary"
                  >
                    <Trans>Save</Trans>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DeviceDeleteAlert
        id={deviceInfo.id as string}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
        }}
      />
    </>
  )
}

function MetricChip({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        <span className="text-[color:var(--color-primary)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 truncate text-lg font-semibold text-[color:var(--color-foreground)]">
        {value}
      </div>
    </div>
  )
}

function InlineStat({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
      <div className="text-xs text-[color:var(--color-muted)]">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}

function StateBadge({
  children,
  tone
}: {
  children: ReactNode
  tone: 'danger' | 'primary' | 'success' | 'warning'
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] uppercase',
        tone === 'primary' &&
          'border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]',
        tone === 'warning' &&
          'border-amber-400/30 bg-amber-400/10 text-amber-300',
        tone === 'success' &&
          'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        tone === 'danger' &&
          'border-rose-400/30 bg-rose-400/10 text-rose-300'
      )}
    >
      {children}
    </div>
  )
}

function MetaRow({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: React.ReactNode
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-[color:var(--color-card)]/60 p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        <span className="text-[color:var(--color-primary)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 break-words text-sm text-[color:var(--color-foreground)]">
        {value}
      </div>
    </div>
  )
}

function DateMeta({
  date,
  emptyLabel,
  label
}: {
  date?: string | null
  emptyLabel?: ReactNode
  label: ReactNode
}) {
  if (!date) {
    return (
      <MetaRow
        icon={<FiLock className="size-4" />}
        label={label}
        value={typeof emptyLabel === 'string' ? emptyLabel : '—'}
      />
    )
  }

  const absolute = intlFormat(new Date(date), {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric'
  })
  const relative = `${formatDistance(new Date(date), new Date())} ago`

  return (
    <Tooltip content={absolute}>
      <div>
        <MetaRow
          icon={<FiLock className="size-4" />}
          label={label}
          value={relative}
        />
      </div>
    </Tooltip>
  )
}
