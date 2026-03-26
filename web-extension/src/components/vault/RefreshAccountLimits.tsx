import { useState } from 'react'
import { IoMdRefreshCircle } from 'react-icons/io'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { useAppToast } from '@src/ExtensionProviders'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { cn } from '@src/lib/cn'

export function RefreshAccountLimits({
  refreshAccountTooltip,
  setRefreshAccountTooltip
}: {
  refreshAccountTooltip: boolean
  setRefreshAccountTooltip: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useAppToast()
  const { refetch } = useLimitsQuery({
    fetchPolicy: 'cache-and-network'
  })

  return (
    <Tooltip content={<Trans>Refresh account limits!</Trans>}>
      <Button
        aria-label={t`refresh account limits`}
        className="ml-2 self-end"
        disabled={isSyncing}
        size="icon"
        variant="outline"
        onClick={async () => {
          setIsSyncing(true)
          refetch()
          setIsSyncing(false)
          toast({
            title: t`Sync successful`
          })
          setRefreshAccountTooltip(false)
        }}
      >
        <IoMdRefreshCircle
          className={cn('size-5', refreshAccountTooltip ? 'text-amber-300' : undefined)}
        />
      </Button>
    </Tooltip>
  )
}
