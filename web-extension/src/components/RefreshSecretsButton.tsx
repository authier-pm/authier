import React, { useState } from 'react'
import { IconButton, Tooltip } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { device } from '../background/ExtensionDevice'
import { toast } from 'react-toastify'
import { t, Trans } from '@lingui/macro'

export function RefreshSecretsButton() {
  const [isSyncing, setIsSyncing] = useState(false)

  return (
    <Tooltip
      label={<Trans>Synchronize vault</Trans>}
      aria-label={t`Synchronize vault`}
    >
      <IconButton
        size="md"
        ml="2"
        aria-label="menu"
        icon={<IoMdRefreshCircle />}
        disabled={isSyncing}
        onClick={async () => {
          setIsSyncing(true)
          const res = await device.state?.backendSync()
          setIsSyncing(false)
          toast.success(
            t`Sync successful, added/updated ${res?.newAndUpdatedSecrets}, removed ${res?.removedSecrets}`
          )
        }}
      />
    </Tooltip>
  )
}
