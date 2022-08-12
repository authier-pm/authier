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
import {
  AddSecretInput,
  device,
  DeviceState
} from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { toast } from 'react-toastify'
import { useMeExtensionQuery } from './AccountLimits.codegen'

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
    .filter((row) => row[indexUrl] && row[indexUsername] && row[indexPassword])
    .map((row) => ({
      url: row[indexUrl],
      label: row[indexLabel],
      loginCredentials: {
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
export const onFileAccepted: any = (
  file: File,
  pswCount: number
): Promise<IImportedStat> => {
  return new Promise((resolve) => {
    papaparse.parse<string[]>(file, {
      complete: async (results) => {
        if (!results.data) {
          toast.error('failed to parse')
        }
        const mapped = mapCsvToLoginCredentials(results.data)

        const state = device.state as DeviceState

        const toAdd: AddSecretInput = []
        let skipped = 0
        let added = 0
        for (const creds of mapped) {
          if (
            (device.state?.decryptedSecrets.length as number) + added >=
            pswCount
          ) {
            toast.error('You have reached your limit of secrets')
            break
          }

          let hostname: string
          try {
            hostname = new URL(creds.url).hostname
          } catch (error) {
            skipped++
            break
          }

          const input = {
            kind: EncryptedSecretType.LOGIN_CREDENTIALS,
            loginCredentials: creds,
            url: creds.url,
            encrypted: state?.encrypt(JSON.stringify(creds)),
            createdAt: new Date().toJSON(),
            iconUrl: null,
            label:
              creds.label ?? `${creds.loginCredentials.username}@${hostname}`
          }

          if (state.findExistingSecret(input)) {
            skipped++
            continue
          }

          toAdd.push(input)
          added += 1
        }

        await state.addSecrets(toAdd)

        resolve({
          added,
          skipped
        })
      }
    })
  })
}

export const VaultImportExport = () => {
  const [importedStat, setImportedStat] = React.useState<IImportedStat | null>(
    null
  )
  const { data } = useMeExtensionQuery()
  return (
    <Center p={5}>
      <Flex maxW={'1200px'} flexDir={'column'}>
        <Heading size="sm">Import</Heading>
        <Box p={30} width="100%">
          {!importedStat ? (
            <>
              <ImportFromFile
                onFileAccepted={async (f) => {
                  setImportedStat(
                    await onFileAccepted(f, data?.me.PasswordLimits)
                  )
                }}
              />
              <Text fontSize={16} mt={8} mb={6}>
                <Trans>
                  We support importing from <code>csv</code> files.
                  Lastpass/Bitwarden will fork fine, file exported from other
                  password managers might work as well, but it{`&apos`}s not
                  guaranteed.
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
        <Box m={8}>
          <ExportLoginCredentialsToCsvButton />
          <br />

          <ExportTOTPToCsvButton />
        </Box>
      </Flex>
    </Center>
  )
}
