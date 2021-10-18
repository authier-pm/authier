import { Button } from '@chakra-ui/react'
import React, { useContext } from 'react'
import papaparse from 'papaparse'
import { AuthsContext } from '@src/providers/AuthsProvider'
import { downloadAsFile } from '@src/util/downloadAsFile'
import { Trans } from '@lingui/macro'

// TODO use somewhere
export const ExportTOTPToCsvButton = () => {
  const { auths } = useContext(AuthsContext)

  return (
    <Button
      mt={4}
      colorScheme="teal"
      type="submit"
      onClick={() => {
        const csv = papaparse.unparse(auths)
        downloadAsFile(csv, 'totp')
      }}
    >
      <Trans>Export TOTP to CSV</Trans>
    </Button>
  )
}
