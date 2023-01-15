import {
  Alert,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Link,
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
import { useMeExtensionQuery } from './AccountLimits.codegen'
import { LoginCredentialsTypeWithMeta } from '@src/util/useDeviceState'
import { toast } from '@src/Providers'

type MappedCSVInput = LoginCredentialsTypeWithMeta[]

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

const mapCsvToLoginCredentials = (csv: string[][]): MappedCSVInput => {
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
      label: row[indexLabel],
      url: row[indexUrl],
      username: row[indexUsername],
      password: row[indexPassword],
      iconUrl: null // TODO add icon Url if it is in the CSV
    }))
}

export interface IImportedStat {
  added: number
  skipped: number
}

/**
 * should support lastpass and bitwarden for now, TODO write e2e specs
 */
export const onCSVFileAccepted: any = (
  file: File,
  pswCount: number
): Promise<IImportedStat> => {
  return new Promise((resolve) => {
    papaparse.parse<string[]>(file, {
      complete: async (results) => {
        if (!results.data) {
          toast({
            title: 'failed to parse',
            status: 'error',
            isClosable: true
          })
        }
        const mapped: MappedCSVInput = mapCsvToLoginCredentials(results.data)

        const state = device.state as DeviceState

        const toAdd: AddSecretInput = []
        let skipped = 0
        let added = 0
        for (const creds of mapped) {
          if (
            (device.state?.decryptedSecrets.length as number) + added >=
            pswCount
          ) {
            toast({
              title: 'You have reached your limit of secrets',
              status: 'error',
              isClosable: true
            })
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
            encrypted: await state?.encrypt(JSON.stringify(creds)),
            createdAt: new Date().toJSON(),
            iconUrl: null,
            label: creds.label ?? `${creds.username}@${hostname}`
          }

          if (await state.findExistingSecret(input)) {
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

export const onJsonFileAccepted = async (file: File) => {
  const state = device.state as DeviceState
  type AuthyExportType = {
    secret: string
    period: number
    originalName: string
    createdDate: number
    digits: number
  }[]

  const parsed: AuthyExportType = JSON.parse(await file.text())
  const toAdd: AddSecretInput = []
  for (const totp of parsed) {
    if (!totp.originalName) {
      continue // for some reason authy has secrets without any name. These are not shown in the Authy app, so we are skipping. Nobody would know what these secrets are for anyway
    }
    const totpWithMeta = {
      ...totp,
      iconUrl: null,
      label: totp.originalName
    }
    toAdd.push({
      kind: EncryptedSecretType.TOTP,
      totp: totpWithMeta,

      encrypted: await state.encrypt(JSON.stringify(totpWithMeta)),
      createdAt: new Date().toJSON()
    })
  }
  await state.addSecrets(toAdd)
  return { added: toAdd.length, skipped: 0 }
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
                  if (f.type === 'text/csv') {
                    setImportedStat(
                      await onCSVFileAccepted(f, data?.me.PasswordLimits)
                    )
                  } else if (f.type === 'application/json') {
                    setImportedStat(await onJsonFileAccepted(f))
                  }
                }}
              />
              <Text fontSize={16} mt={8} mb={6}>
                <Trans>
                  We support importing from <code>csv</code> and{' '}
                  <code>json</code> files.
                  <ul>
                    <li>
                      Lastpass/Bitwarden will work fine, file exported from
                      other password managers might work as well, but it's not
                      guaranteed.
                    </li>
                    <li>
                      For JSON, it must be a file exported from{' '}
                      <Link href="https://www.npmjs.com/package/authy-desktop-export">
                        authy-desktop-export
                      </Link>
                    </li>
                  </ul>
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
