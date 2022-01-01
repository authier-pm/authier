import { Button } from '@chakra-ui/react'
import React, { useContext } from 'react'
import papaparse from 'papaparse'

import { downloadAsFile } from '@src/util/downloadAsFile'
import { Trans } from '@lingui/macro'
import { BackgroundContext } from '@src/providers/BackgroundProvider'

// TODO use somewhere
export const ExportTOTPToCsvButton = () => {
  const { TOTPSecrets } = useContext(BackgroundContext)

  return (
    <Button
      mt={4}
      colorScheme="teal"
      type="submit"
      onClick={() => {
        if (TOTPSecrets.length > 0) {
          const csv = papaparse.unparse(TOTPSecrets)
          downloadAsFile(csv, 'totp')
        }
      }}
    >
      <Trans>Export TOTP to CSV</Trans>
    </Button>
  )
}
