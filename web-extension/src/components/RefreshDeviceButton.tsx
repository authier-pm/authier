import React, { useState } from 'react'
import { IconButton, Tooltip } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { device } from '@src/background/ExtensionDevice'
import { toast } from 'react-toastify'
import { t, Trans } from '@lingui/macro'

export function RefreshDeviceButton({ refetch }: { refetch: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false)

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
          refetch()
          setIsSyncing(false)
          toast.success(t`Sync successful`)
        }}
      />
    </Tooltip>
  )
}
