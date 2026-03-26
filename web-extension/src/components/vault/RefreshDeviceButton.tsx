import React, { useState } from 'react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useDevicesRequestsQuery } from '@shared/graphql/AccountDevices.codegen'
import { useDevicesListWithDataQuery } from '@src/pages-vault/Devices.codegen'
import { useAppToast } from '@src/ExtensionProviders'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { cn } from '@src/lib/cn'

export function RefreshDeviceButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useAppToast()

  const { refetch: devicesRequestsRefetch } = useDevicesRequestsQuery()
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()
  return (
    <Tooltip content={<Trans>Synchronize devices</Trans>}>
      <Button
        aria-label={t`Synchronize devices`}
        className="ml-2"
        disabled={isSyncing}
        size="icon"
        variant="outline"
        onClick={async () => {
          setIsSyncing(true)
          devicesRefetch()
          devicesRequestsRefetch()
          setIsSyncing(false)
          toast({
            title: t`Sync successful`
          })
        }}
      >
        <IoMdRefreshCircle
          className={cn('size-5', isSyncing ? 'animate-spin' : undefined)}
        />
      </Button>
    </Tooltip>
  )
}
