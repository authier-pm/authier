import { useEffect, useState } from 'react'
import papaparse from 'papaparse'
import { Trans } from '@lingui/react/macro'
import {
  AddSecretInput,
  device,
  type DeviceState,
  type SecretTypeUnion
} from '@src/background/ExtensionDevice'
import {
  ExportLoginCredentialsToCsvButton,
  ExportTOTPToCsvButton
} from '@src/components/vault/ExportCsvButtons'
import { ImportFromFile } from '@src/components/vault/ImportFromFile'
import { Txt } from '@src/components/util/Txt'
import { Button } from '@src/components/ui/button'
import {
  ILoginSecret,
  type LoginCredentialsTypeWithMeta
} from '@src/util/useDeviceState'
import { toast } from '@src/ExtensionProviders'
import { useRemoveEncryptedSecretsMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { constructURL } from '@shared/urlUtils'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'

type MappedCSVInput = LoginCredentialsTypeWithMeta[]

const mapCsvToLoginCredentials = (csv: string[][]): MappedCSVInput => {
  const [header] = csv
  const indexUsername = header.findIndex((x) => x.match(/username/i))
  const indexLabel = header.findIndex((x) => x.match(/name|title/i))
  const indexPassword = header.findIndex((x) => x.match(/password/i))
  const indexUrl = header.findIndex((x) => x.match(/url|uri|login_url/i))

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
      iconUrl: null
    }))
}

export interface IImportedStat {
  added: number
  skipped: number
}

export const onCSVFileAccepted = (
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

          const hostname = constructURL(creds.url).hostname
          if (!hostname) {
            skipped++
            toast({
              title: `skipping secret because url ${creds.url} could not be parsed`,
              status: 'warning',
              isClosable: true
            })
            continue
          }

          const input: Omit<ILoginSecret, 'id'> = {
            kind: EncryptedSecretType.LOGIN_CREDENTIALS,
            loginCredentials: {
              ...creds,
              url: hostname
            },
            encrypted: await state.encrypt(JSON.stringify(creds)),
            createdAt: new Date().toJSON()
          }

          if (await state.findExistingSecret(creds)) {
            skipped++
            continue
          }

          toAdd.push(input)
          added += 1
        }

        await state.addSecrets(toAdd)
        resolve({ added, skipped })
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
      continue
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
  const { data } = useLimitsQuery()

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
          }
          if (
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

  return (
    <div className="flex justify-center p-5">
      <div className="flex max-w-[1200px] flex-col">
        <h2 className="text-sm font-semibold text-[color:var(--color-foreground)]">
          Import
        </h2>
        <div className="w-full p-[30px]">
          {!importedStat ? (
            <>
              <ImportFromFile
                onFileAccepted={async (f) => {
                  if (f.type === 'text/csv') {
                    const loginCredentialsLimit = data?.me.loginCredentialsLimit
                    setImportedStat(
                      await onCSVFileAccepted(f, loginCredentialsLimit ?? 50)
                    )
                  } else if (f.type === 'application/json') {
                    setImportedStat(await onJsonFileAccepted(f))
                  }
                }}
              />
              <ul className="mb-6 mt-8 list-disc space-y-2 pl-5 text-base">
                <li>
                  <Trans>
                    We support importing from <code>csv</code> and{' '}
                    <code>json</code> files.
                  </Trans>
                </li>
                <li>
                  Lastpass/Bitwarden will work fine, file exported from other
                  password managers might work as well, but it&apos;s not guaranteed.
                  Please send us a request for a new type of export{' '}
                  <a className="underline" href="https://twitter.com/authierpm">
                    here
                  </a>
                  .
                </li>
                <li>
                  For JSON, it must be a file exported from{' '}
                  <a
                    className="underline"
                    href="https://www.npmjs.com/package/authy-desktop-export"
                  >
                    authy-desktop-export
                  </a>
                </li>
              </ul>
            </>
          ) : (
            <>
              <div className="rounded-[var(--radius-md)] border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <Trans>
                  Successfully added {importedStat.added}, skipped{' '}
                  {importedStat.skipped}
                </Trans>
              </div>
              <div className="flex justify-center">
                <Button
                  className="m-2"
                  onClick={() => {
                    setImportedStat(null)
                  }}
                >
                  <Trans>Import another</Trans>
                </Button>
              </div>
            </>
          )}
        </div>

        <h2 className="text-sm font-semibold text-[color:var(--color-foreground)]">
          Export
        </h2>
        <div className="m-8">
          <ExportLoginCredentialsToCsvButton />
          <br />
          <ExportTOTPToCsvButton />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[color:var(--color-foreground)]">
            Merge duplicates
          </h2>
          {duplicates.length ? (
            <div className="m-8 flex items-center">
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
                Delete duplicates now
              </Button>
            </div>
          ) : (
            <Trans>You have no duplicates in your secrets</Trans>
          )}
        </div>
      </div>
    </div>
  )
}
