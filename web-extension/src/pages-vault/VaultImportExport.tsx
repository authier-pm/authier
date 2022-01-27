import {
  Alert,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Text
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import {
  ExportLoginCredentialsToCsvButton,
  ExportTOTPToCsvButton
} from '@src/components/vault/ExportCsvButtons'
import { ImportFromFile } from '@src/components/vault/ImportFromFile'
import React from 'react'
import papaparse from 'papaparse'
import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { toast } from 'react-toastify'

// const csvHeaderNames = {
//   password: [
//     'password',
//     'login_password'
//   ],
//   url: [
//     'url', // lastpass
//     'login_uri' // bitwarden
//   ]
// }

const mapCsvToLoginCredentials = (csv: string[][]) => {
  const [header] = csv

  const indexUsername = header.findIndex((x) => x.match(/username/i))
  const indexLabel = header.findIndex((x) => x === 'name')
  const indexPassword = header.findIndex((x) => x.match(/password/i))
  const indexUrl = header.findIndex((x) => {
    return x === 'url' || x === 'login_uri'
  })

  if (
    indexUsername === -1 ||
    indexLabel === -1 ||
    indexPassword === -1 ||
    indexUrl === -1
  ) {
    return []
  }

  return csv
    .slice(1)
    .filter((row) => row[indexUrl])
    .map((row) => ({
      url: row[indexUrl],
      label: row[indexLabel],
      loginCredential: {
        username: row[indexUsername],
        password: row[indexPassword]
      }
    }))
}

export interface IImportedStat {
  added: number
  skipped: number
}

/**
 * should support lastpass and bitwarden for now, TODO write e2e specs
 */
export const onFileAccepted: any = (file: File): Promise<IImportedStat> => {
  return new Promise((resolve, reject) => {
    papaparse.parse<string[]>(file, {
      complete: async (results) => {
        if (!results.data) {
          toast.error('failed to parse')
        }
        const mapped = mapCsvToLoginCredentials(results.data)
        // TODO add to device state
        const state = device.state
        let skipped = 0
        for (const creds of mapped) {
          const hostname = new URL(creds.url).hostname
          const secret = await state?.addSecret({
            kind: EncryptedSecretType.LOGIN_CREDENTIALS,
            loginCredentials: creds.loginCredential,
            encrypted: state.encrypt(JSON.stringify(creds.loginCredential)),
            iconUrl: null,
            url: creds.url,
            label:
              creds.label ?? `${creds.loginCredential.username}@${hostname}`
          })
          if (!secret) {
            skipped++
          }
        }

        resolve({
          added: mapped.length - skipped,
          skipped
        })
      }
    })
  })
}

export const VaultImportExport: React.FC<{}> = () => {
  const [importedStat, setImportedStat] = React.useState<IImportedStat | null>(
    null
  )

  return (
    <Center p={5} flexDir={'column'}>
      <Heading size="sm">Import</Heading>
      <Box p={30} width="100%">
        {!importedStat ? (
          <>
            <ImportFromFile
              onFileAccepted={async (f) => {
                setImportedStat(await onFileAccepted(f))
              }}
            />
            <Text fontSize={16} mt={8} mb={6}>
              <Trans>
                We support importing from <code>csv</code> files.
                Lastpass/Bitwarden will fork fine, file exported from other
                password managers might work as well, but it's not guaranteed.
              </Trans>
            </Text>
          </>
        ) : (
          <>
            <Alert status="success">
              <Trans>
                Successfully added {importedStat.added}, skipped{' '}
                {importedStat.skipped}
              </Trans>
            </Alert>
            <Center>
              <Button
                m={2}
                onClick={() => {
                  setImportedStat(null)
                }}
              >
                <Trans>Import another</Trans>
              </Button>
            </Center>
          </>
        )}
      </Box>

      <Heading size="sm">Export</Heading>

      <ExportLoginCredentialsToCsvButton />
      <br />

      <ExportTOTPToCsvButton />
    </Center>
  )
}
