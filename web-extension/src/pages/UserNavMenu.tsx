import { type FunctionComponent } from 'react'
import { Trans } from '@lingui/react/macro'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'

export const UserNavMenu: FunctionComponent = () => {
  return (
    <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-accent)]/40 px-3 py-3">
      <div className="mb-3 text-sm font-semibold text-[color:var(--color-foreground)]">
        Logged as {device.state?.email}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => {
            device.lock()
          }}
        >
          <Trans>Lock device</Trans>
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            device.logout()
          }}
        >
          <Trans>Logout</Trans>
        </Button>
      </div>
    </div>
  )
}
