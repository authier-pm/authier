import {
  Alert,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Link,
  ListItem,
  UnorderedList
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import {
  ExportLoginCredentialsToCsvButton,
  ExportTOTPToCsvButton
} from '@src/components/vault/ExportCsvButtons'
import { ImportFromFile } from '@src/components/vault/ImportFromFile'
import React, { useEffect, useState } from 'react'
import papaparse from 'papaparse'
import {
  AddSecretInput,
  device,
  DeviceState,
  SecretTypeUnion
} from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { useMeExtensionQuery } from './AccountLimits.codegen'
import { LoginCredentialsTypeWithMeta } from '@src/util/useDeviceState'
import { toast } from '@src/ExtensionProviders'
import { constructURL } from '@shared/urlUtils'
import { Txt } from '@src/components/util/Txt'
import { useRemoveEncryptedSecretsMutation } from '@shared/graphql/EncryptedSecrets.codegen'

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

  console.log(indexUsername, indexLabel, indexPassword, indexUrl)
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
        console.log(mapped)

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
            hostname = constructURL(creds.url).hostname
          } catch (error) {
            skipped++
            continue
          }

          const input /* : ILoginSecret | ITOTPSecret */ = {
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
  const [importedStat, setImportedStat] = useState<IImportedStat | null>(null)
  const [duplicates, setDuplicates] = useState<SecretTypeUnion[]>([])
  const [removeEncryptedSecrets] = useRemoveEncryptedSecretsMutation()

  useEffect(() => {
    if (!device.state?.decryptedSecrets) {
      return
    }
    const foundDuplicates: SecretTypeUnion[] = []
    const allSecrets = [...device.state.decryptedSecrets]

    device.state.decryptedSecrets.forEach((secret) => {
      if (
        allSecrets.find((s) => {
          if (
            s.kind === EncryptedSecretType.LOGIN_CREDENTIALS &&
            secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS
          ) {
            return (
              s.loginCredentials.url === secret.loginCredentials.url &&
              s.id !== secret.id &&
              s.loginCredentials.username ===
                secret.loginCredentials.username &&
              s.loginCredentials.password === secret.loginCredentials.password
            )
          } else if (
            s.kind === EncryptedSecretType.TOTP &&
            secret.kind === EncryptedSecretType.TOTP
          ) {
            return (
              s.totp.url === secret.totp.url &&
              s.id !== secret.id &&
              s.totp.secret === secret.totp.secret
            )
          }
          return false
        })
      ) {
        foundDuplicates.push(secret)
        allSecrets.splice(allSecrets.indexOf(secret), 1)
      }
    })

    setDuplicates(foundDuplicates)
  }, [device.state?.decryptedSecrets])
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
                      await onCSVFileAccepted(f, data?.me.loginCredentialsLimit)
                    )
                  } else if (f.type === 'application/json') {
                    setImportedStat(await onJsonFileAccepted(f))
                  }
                }}
              />
              <UnorderedList fontSize={16} mt={8} mb={6}>
                <Trans>
                  We support importing from <code>csv</code> and{' '}
                  <code>json</code> files.
                </Trans>
                <ListItem>
                  Lastpass/Bitwarden will work fine, file exported from other
                  password managers might work as well, but it's not guaranteed.
                  Please send as a request for a new type of export{' '}
                  <a href="https://twitter.com/authierpm">here</a>.
                </ListItem>
                <ListItem>
                  For JSON, it must be a file exported from{' '}
                  <Link
                    textDecor={'underline'}
                    href="https://www.npmjs.com/package/authy-desktop-export"
                  >
                    authy-desktop-export
                  </Link>
                </ListItem>
              </UnorderedList>
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

        <Box>
          <Heading size="sm">Merge duplicates</Heading>
          {duplicates.length ? (
            <Flex m={8} align={'center'}>
              <Txt mr={6}>
                found {duplicates.length} duplicates in your secrets
              </Txt>
              <Button
                onClick={async () => {
                  const duplicateIds = duplicates.map(({ id }) => id)
                  await removeEncryptedSecrets({
                    variables: {
                      secrets: duplicateIds
                    }
                  })

                  await device.state?.removeSecrets(duplicateIds)
                  setDuplicates([])
                }}
              >
                Merge now
              </Button>
            </Flex>
          ) : (
            <Trans>You have no duplicates in your secrets</Trans>
          )}
        </Box>
      </Flex>
    </Center>
  )
}
