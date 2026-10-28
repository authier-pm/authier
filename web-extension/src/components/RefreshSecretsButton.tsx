import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { IoMdRefreshCircle } from 'react-icons/io'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { cn } from '@src/lib/cn'
import { useAppToast } from '@src/ExtensionProviders'

export function RefreshSecretsButton({
  onSynced
}: { onSynced?: () => Promise<unknown> } = {}) {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useAppToast()

  return (
    <Tooltip content={<Trans>Synchronize vault</Trans>}>
      <Button
        aria-label={t`Synchronize vault`}
        disabled={isSyncing}
        size="icon"
        variant="outline"
        onClick={async () => {
          setIsSyncing(true)
          let res

          try {
            res = await device.state?.backendSync()
            await onSynced?.()
          } catch {
            toast({
              title: 'Could not synchronize the vault',
              description:
                'Locally saved items remain encrypted in this browser. Check your connection and try again.',
              status: 'error',
              isClosable: true
            })
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
      >
        <IoMdRefreshCircle
          className={cn('size-5', isSyncing ? 'animate-spin' : undefined)}
        />
      </Button>
    </Tooltip>
  )
}
