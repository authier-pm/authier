import React, { useState } from 'react'
import { IconButton, Tooltip, useToast } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'

import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useDevicesRequestsQuery } from '@shared/graphql/AccountDevices.codegen'
import { useDevicesListWithDataQuery } from '@src/pages-vault/Devices.codegen'

export function RefreshDeviceButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()

  const { refetch: devicesRequestsRefetch } = useDevicesRequestsQuery()
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()
  return (
    <Tooltip
      label={<Trans>Synchronize devices</Trans>}
      aria-label={t`Synchronize devices`}
    >
      <IconButton
        size="md"
        ml="2"
        aria-label="menu"
        icon={<IoMdRefreshCircle />}
        isLoading={isSyncing}
        onClick={async () => {
          setIsSyncing(true)
          devicesRefetch()
          devicesRequestsRefetch()
          setIsSyncing(false)
          toast({
            title: t`Sync successful`
          })
        }}
      />
    </Tooltip>
  )
}
