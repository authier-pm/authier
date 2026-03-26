import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { IoMdArchive } from 'react-icons/io'
import browser from 'webextension-polyfill'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'

export function openVaultTab(afterHash = '') {
  const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1

  browser.tabs.create({
    url: isChrome ? `js/vault.html#${afterHash}` : `vault.html#${afterHash}`
  })
}

export function AuthLinkPage() {
  return (
    <div className="flex min-h-[220px] w-[315px] items-center justify-center px-6 py-8">
      <div className="extension-surface flex items-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] px-5 py-4 shadow-lg">
        <h1 className="text-sm font-semibold text-[color:var(--color-foreground)]">
          <Trans>Open vault to login or sign up</Trans>
        </h1>
        <Tooltip content={t`Open vault`}>
          <Button
            aria-label="Open vault"
            size="icon"
            variant="outline"
            onClick={() => {
              openVaultTab()
            }}
          >
            <IoMdArchive className="size-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
