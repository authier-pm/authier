import { Button } from '@chakra-ui/react'
import React, { useContext } from 'react'
import papaparse from 'papaparse'

import { downloadAsFile } from '../../util/downloadAsFile'
import { Trans } from '@lingui/macro'
import { DeviceStateContext } from '../../providers/DeviceStateProvider'

export const ExportTOTPToCsvButton = () => {
  const { TOTPSecrets } = useContext(DeviceStateContext)

  return (
    <Button
      mt={4}
      minW="300px"
      colorScheme="teal"
      type="submit"
      onClick={() => {
        const csv = papaparse.unparse(TOTPSecrets)
        downloadAsFile(csv, 'totp')
      }}
    >
      <Trans>Export TOTP to CSV</Trans>
    </Button>
  )
}

export const ExportLoginCredentialsToCsvButton = () => {
  const { loginCredentials: LoginCredentials } = useContext(DeviceStateContext)

  return (
    <Button
      mt={4}
      minW="300px"
      colorScheme="teal"
      type="submit"
      onClick={() => {
        // Call here export mutation for export notification
        const csv = papaparse.unparse(
          LoginCredentials.map(({ id, loginCredentials }) => ({
            id,
            url: loginCredentials.url,
            label: loginCredentials.label,
            username: loginCredentials.username,
            password: loginCredentials.password
          }))
        )
        downloadAsFile(csv, 'credentials')
      }}
    >
      <Trans>Export Login Credentials to CSV</Trans>
    </Button>
  )
}
