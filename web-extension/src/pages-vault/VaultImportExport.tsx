import { useEffect, useState } from 'react'
import papaparse from 'papaparse'
import { Trans } from '@lingui/react/macro'
import { FiArrowRight, FiCheckCircle, FiCopy, FiDownload, FiUpload } from 'react-icons/fi'
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
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
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
      iconUrl: null,
      label: row[indexLabel],
      password: row[indexPassword],
      url: row[indexUrl],
      username: row[indexUsername]
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
            isClosable: true,
            status: 'error',
            title: 'failed to parse'
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
              isClosable: true,
              status: 'error',
              title: 'You have reached your limit of secrets'
            })
            break
          }

          const hostname = constructURL(creds.url).hostname
          if (!hostname) {
            skipped++
            toast({
              isClosable: true,
              status: 'warning',
              title: `skipping secret because url ${creds.url} could not be parsed`
            })
            continue
          }

          const input: Omit<ILoginSecret, 'id'> = {
            createdAt: new Date().toJSON(),
            encrypted: await state.encrypt(JSON.stringify(creds)),
            kind: EncryptedSecretType.LOGIN_CREDENTIALS,
            loginCredentials: {
              ...creds,
              url: hostname
            }
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
    createdDate: number
    digits: number
    originalName: string
    period: number
    secret: string
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
      createdAt: new Date().toJSON(),
      encrypted: await state.encrypt(JSON.stringify(totpWithMeta)),
      kind: EncryptedSecretType.TOTP,
      totp: totpWithMeta
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
              s.loginCredentials.username === secret.loginCredentials.username &&
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
    <div className="extension-scrollbar mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 overflow-y-auto p-6 md:p-8">
      <section className="flex flex-col gap-3">
        <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
          Import & Export
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
          Move secrets in and out without losing structure
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)] md:text-base">
          Import credentials from supported file formats, export backups on
          demand, and clean duplicate records before they spread.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(16,54,56,0.96)_0%,rgba(17,31,32,1)_75%)]">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-primary)]">
              <FiUpload className="size-5" />
            </div>
            <CardTitle>Import secrets</CardTitle>
            <CardDescription>
              Bring in CSV exports from mainstream password managers or JSON
              files from Authy export tooling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!importedStat ? (
              <>
                <ImportFromFile
                  onFileAccepted={async (file) => {
                    if (file.type === 'text/csv') {
                      const loginCredentialsLimit = data?.me.loginCredentialsLimit
                      setImportedStat(
                        await onCSVFileAccepted(file, loginCredentialsLimit ?? 50)
                      )
                    } else if (file.type === 'application/json') {
                      setImportedStat(await onJsonFileAccepted(file))
                    }
                  }}
                />
                <div className="grid gap-3">
                  <InfoRow>
                    <Trans>
                      We support importing from <code>csv</code> and <code>json</code>{' '}
                      files.
                    </Trans>
                  </InfoRow>
                  <InfoRow>
                    LastPass and Bitwarden exports usually work well. Other
                    password manager exports may work too, but are not guaranteed.
                  </InfoRow>
                  <InfoRow>
                    JSON imports must come from the `authy-desktop-export` format.
                  </InfoRow>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[var(--radius-lg)] border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <FiCheckCircle className="size-5" />
                    <div className="text-sm font-medium">
                      <Trans>
                        Successfully added {importedStat.added}, skipped{' '}
                        {importedStat.skipped}
                      </Trans>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setImportedStat(null)
                  }}
                >
                  <FiArrowRight className="size-4" />
                  <Trans>Import another</Trans>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-surface-muted)] text-[color:var(--color-primary)]">
                <FiDownload className="size-5" />
              </div>
              <CardTitle>Export backups</CardTitle>
              <CardDescription>
                Download your credentials or one-time passwords as CSV whenever
                you need an offline copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ExportLoginCredentialsToCsvButton />
              <ExportTOTPToCsvButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-surface-muted)] text-[color:var(--color-primary)]">
                <FiCopy className="size-5" />
              </div>
              <CardTitle>Merge duplicates</CardTitle>
              <CardDescription>
                Detect repeated login credentials and TOTP entries stored in your
                vault.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {duplicates.length ? (
                <>
                  <div className="rounded-[var(--radius-lg)] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                    Found {duplicates.length} duplicates in your secrets.
                  </div>
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
                    variant="destructive"
                  >
                    Delete duplicates now
                  </Button>
                </>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4 text-sm text-[color:var(--color-muted)]">
                  <Trans>You have no duplicates in your secrets</Trans>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4 text-sm leading-6 text-[color:var(--color-muted)]">
      {children}
    </div>
  )
}
