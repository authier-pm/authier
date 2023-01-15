import { useState } from 'react'
import { IconButton, Tooltip, useToast } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { device } from '@src/background/ExtensionDevice'
import { t, Trans } from '@lingui/macro'

export function RefreshSecretsButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()

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
          let res
          try {
            res = await device.state?.backendSync()
          } catch (error) {
            setIsSyncing(false)
            return
          }
          toast({
            title: t`Sync successful`,
            description: `added/updated ${res?.newAndUpdatedSecrets}, removed ${res?.removedSecrets}`,
            status: 'success',
            position: 'bottom',
            isClosable: true
          })
          setIsSyncing(false)
        }}
      />
    </Tooltip>
  )
}
