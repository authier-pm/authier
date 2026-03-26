import { useContext } from 'react'
import papaparse from 'papaparse'
import { Trans } from '@lingui/react/macro'
import { FiDownload } from 'react-icons/fi'
import { Button } from '@src/components/ui/button'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { downloadAsFile } from '@src/util/downloadAsFile'

export const ExportTOTPToCsvButton = () => {
  const { TOTPSecrets } = useContext(DeviceStateContext)

  return (
    <Button
      className="w-full justify-start sm:w-auto"
      onClick={() => {
        const csv = papaparse.unparse(
          TOTPSecrets.map(({ id, totp }) => ({
            id,
            label: totp.label,
            sercret: totp.secret,
            url: totp.url
          }))
        )
        downloadAsFile(csv, 'totp')
      }}
      variant="outline"
    >
      <FiDownload className="size-4" />
      <Trans>Export TOTP to CSV</Trans>
    </Button>
  )
}

export const ExportLoginCredentialsToCsvButton = () => {
  const { loginCredentials } = useContext(DeviceStateContext)

  return (
    <Button
      className="w-full justify-start sm:w-auto"
      onClick={() => {
        const csv = papaparse.unparse(
          loginCredentials.map(({ id, loginCredentials: secret }) => ({
            id,
            label: secret.label,
            password: secret.password,
            url: secret.url,
            username: secret.username
          }))
        )
        downloadAsFile(csv, 'credentials')
      }}
      variant="outline"
    >
      <FiDownload className="size-4" />
      <Trans>Export Login Credentials to CSV</Trans>
    </Button>
  )
}
