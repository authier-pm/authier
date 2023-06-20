import { useState } from 'react'
import { IconButton, Tooltip, useToast } from '@chakra-ui/react'
import { IoMdRefreshCircle } from 'react-icons/io'

import { t, Trans } from '@lingui/macro'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'

export function RefreshAccountLimits({
  refreshAccountTooltip,
  setRefreshAccountTooltip
}: {
  refreshAccountTooltip: boolean
  setRefreshAccountTooltip: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()
  const { refetch } = useLimitsQuery({
    fetchPolicy: 'network-only'
  })

  return (
    <Tooltip
      label={<Trans>Refresh account limits!</Trans>}
      aria-label={t`refresh account limits`}
      placement="top"
      isOpen={refreshAccountTooltip}
      bg="orange.300"
    >
      <IconButton
        alignSelf={'end'}
        size="md"
        ml="2"
        aria-label="menu"
        icon={<IoMdRefreshCircle />}
        disabled={isSyncing}
        onClick={async () => {
          setIsSyncing(true)
          refetch()
          setIsSyncing(false)
          toast({
            title: t`Sync successful`
          })
          setRefreshAccountTooltip(false)
        }}
      />
    </Tooltip>
  )
}
