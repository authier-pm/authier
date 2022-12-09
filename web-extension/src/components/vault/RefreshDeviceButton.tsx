import React, { useState } from 'react'
import { IconButton, Tooltip } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { toast } from 'react-toastify'
import { t, Trans } from '@lingui/macro'
import {
  useDevicesRequestsQuery,
  useMyDevicesQuery
} from '@shared/graphql/AccountDevices.codegen'

export function RefreshDeviceButton() {
  const [isSyncing, setIsSyncing] = useState(false)

  const { refetch: devicesRequestsRefetch } = useDevicesRequestsQuery()
  const { refetch: devicesRefetch } = useMyDevicesQuery()
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
        disabled={isSyncing}
        onClick={async () => {
          setIsSyncing(true)
          devicesRefetch()
          devicesRequestsRefetch()
          setIsSyncing(false)
          toast.success(t`Sync successful`)
        }}
      />
    </Tooltip>
  )
}
