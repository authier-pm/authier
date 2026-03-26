import { useContext, useEffect } from 'react'
import { t } from '@lingui/core/macro'
import { useNavigate } from 'react-router-dom'
import browser from 'webextension-polyfill'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { IoList } from 'react-icons/io5'
import { PiSquaresFourDuotone } from 'react-icons/pi'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { TableList } from '@src/components/vault/TableList'
import { VirtualizedList } from '@src/components/vault/VirtualizedList'
import { Button } from '@src/components/ui/button'
import { Card, CardContent } from '@src/components/ui/card'
import { Input } from '@src/components/ui/input'
import { Tooltip } from '@src/components/ui/tooltip'

export const VaultList = ({ tableView }: { tableView: boolean }) => {
  const { loginCredentials, TOTPSecrets, setSecuritySettings } =
    useContext(DeviceStateContext)
  const navigate = useNavigate()
  const { data, loading, error } = useSyncSettingsQuery()
  const [filterBy, setFilterBy] = useQueryParam(
    'filterBy',
    withDefault(StringParam, '')
  )

  useEffect(() => {
    if (!data) {
      return
    }

    setSecuritySettings({
      autofillCredentialsEnabled: data.currentDevice.autofillCredentialsEnabled,
      autofillTOTPEnabled: data.currentDevice.autofillTOTPEnabled,
      uiLanguage: data.me.uiLanguage,
      syncTOTP: data.currentDevice.syncTOTP,
      vaultLockTimeoutSeconds: data.currentDevice.vaultLockTimeoutSeconds,
      notificationOnWrongPasswordAttempts:
        data.me.notificationOnWrongPasswordAttempts,
      notificationOnVaultUnlock: data.me.notificationOnVaultUnlock
    })
  }, [data, setSecuritySettings])

  if (loading && !data) {
    return (
      <Card className="extension-surface">
        <CardContent className="flex min-h-[320px] items-center justify-center p-6 text-sm text-[color:var(--color-muted)]">
          Loading vault...
        </CardContent>
      </Card>
    )
  }

  const secretCount = loginCredentials.length + TOTPSecrets.length

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Card className="border-white/10 extension-surface">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-3xl">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
              <Input
                className="h-11 rounded-full bg-[color:var(--color-input)] pl-10 pr-11"
                placeholder={t`Search vault by url, username, label or password`}
                value={filterBy}
                onChange={(event) => {
                  setFilterBy(event.target.value)
                }}
              />
              {filterBy ? (
                <button
                  aria-label={t`Clear search`}
                  className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
                  onClick={() => {
                    setFilterBy('')
                  }}
                  type="button"
                >
                  <FiX className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-2 text-sm font-medium">
                {secretCount} {t`secrets`}
              </div>
              <RefreshSecretsButton />
              <Tooltip
                content={tableView ? t`Show card view` : t`Show table view`}
              >
                <Button
                  aria-label={tableView ? t`Show card view` : t`Show table view`}
                  onClick={async () => {
                    await browser.storage.sync.set({
                      vaultTableView: !tableView
                    })
                  }}
                  size="icon"
                  variant="outline"
                >
                  {tableView ? (
                    <PiSquaresFourDuotone className="size-5" />
                  ) : (
                    <IoList className="size-5" />
                  )}
                </Button>
              </Tooltip>

              {error ? (
                <Tooltip content={t`You have reached your limit`}>
                  <span>
                    <Button disabled size="sm" variant="outline">
                      <FiPlus className="size-4" />
                      {t`Add item`}
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  onClick={async () => navigate('/addItem')}
                  size="sm"
                  variant="primary"
                >
                  <FiPlus className="size-4" />
                  {t`Add item`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden border-white/10 extension-surface">
        <CardContent className="flex h-full min-h-0 flex-1 flex-col p-0">
          {tableView ? (
            <TableList filter={filterBy} />
          ) : (
            <VirtualizedList filter={filterBy} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
