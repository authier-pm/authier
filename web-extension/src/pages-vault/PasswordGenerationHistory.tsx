import { useContext, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Field, Formik, type FormikHelpers } from 'formik'
import {
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiKey,
  FiPlus,
  FiTrash2,
  FiX
} from 'react-icons/fi'
import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import {
  clearGeneratedPasswordHistory,
  GENERATED_PASSWORD_HISTORY_STORAGE_KEY,
  getGeneratedPasswordHistory,
  GeneratedPasswordHistoryEntry,
  normalizeHistoryHostname
} from '@src/util/generatedPasswordHistory'
import { toast } from '@src/ExtensionProviders'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { Input } from '@src/components/ui/input'

const emptyCredentialValues: credentialValues = {
  label: '',
  password: '',
  url: '',
  username: ''
}

const getInitialValuesForEntry = (
  entry: GeneratedPasswordHistoryEntry | null
): credentialValues => {
  if (!entry) {
    return emptyCredentialValues
  }

  return {
    label: entry.hostname,
    password: entry.password,
    url: entry.hostname,
    username: ''
  }
}

export const PasswordGenerationHistory = () => {
  const { loginCredentials } = useContext(DeviceStateContext)
  const [history, setHistory] = useState<GeneratedPasswordHistoryEntry[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [revealedEntryIds, setRevealedEntryIds] = useState<string[]>([])
  const [selectedEntry, setSelectedEntry] =
    useState<GeneratedPasswordHistoryEntry | null>(null)

  useEffect(() => {
    let isDisposed = false

    const syncHistory = async () => {
      const nextHistory = await getGeneratedPasswordHistory()
      if (isDisposed) {
        return
      }

      setHistory(nextHistory)
      setHistoryLoaded(true)
    }

    const onStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (
        areaName === 'local' &&
        changes[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]
      ) {
        void syncHistory()
      }
    }

    void syncHistory()
    browser.storage.onChanged.addListener(onStorageChange)

    return () => {
      isDisposed = true
      browser.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

  const isEntrySaved = (entry: GeneratedPasswordHistoryEntry) => {
    return loginCredentials.some(({ loginCredentials: secret }) => {
      return (
        normalizeHistoryHostname(secret.url) === entry.hostname &&
        secret.password === entry.password
      )
    })
  }

  const togglePasswordVisibility = (entryId: string) => {
    setRevealedEntryIds((current) => {
      if (current.includes(entryId)) {
        return current.filter((id) => id !== entryId)
      }

      return [...current, entryId]
    })
  }

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password)
    toast({
      status: 'success',
      title: 'Password copied'
    })
  }

  const clearHistory = async () => {
    const shouldClear = window.confirm(
      'Clear password generation history? This cannot be undone.'
    )
    if (!shouldClear) {
      return
    }

    await clearGeneratedPasswordHistory()
    setHistory([])
    setSelectedEntry(null)
    setRevealedEntryIds([])
    toast({
      status: 'success',
      title: 'Password generation history cleared'
    })
  }

  if (!historyLoaded) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

  return (
    <>
      <div className="extension-scrollbar mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 overflow-y-auto p-6 md:p-8">
        <section className="flex flex-col gap-3">
          <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
            Password generation history
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
            Recover generated passwords before they disappear into redirects
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)] md:text-base">
            Generated passwords are kept locally so you can recover them after
            fast form submissions, redirects, or interrupted account creation.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1.15fr)]">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-[color:var(--color-muted)]">
                No generated passwords have been recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {history.map((entry) => {
                const isSaved = isEntrySaved(entry)
                const isRevealed = revealedEntryIds.includes(entry.id)

                return (
                  <Card key={entry.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-lg font-semibold text-[color:var(--color-foreground)]">
                              {entry.hostname}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
                              <FiClock className="size-4" />
                              {new Date(entry.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {isSaved ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                              <FiCheckCircle className="size-4" />
                              Saved
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setSelectedEntry(entry)
                              }}
                              variant="outline"
                            >
                              <FiPlus className="size-4" />
                              Save
                            </Button>
                          )}
                        </div>

                        <HistoryField label="URL" value={entry.pageUrl} />

                        <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
                          <div className="text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
                            Password
                          </div>
                          <div className="mt-3 flex flex-col gap-3 md:flex-row">
                            <Input
                              className="font-mono"
                              readOnly
                              type={isRevealed ? 'text' : 'password'}
                              value={entry.password}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  togglePasswordVisibility(entry.id)
                                }}
                                variant="outline"
                              >
                                {isRevealed ? (
                                  <FiEyeOff className="size-4" />
                                ) : (
                                  <FiEye className="size-4" />
                                )}
                                {isRevealed ? 'Hide' : 'Reveal'}
                              </Button>
                              <Button
                                onClick={() => {
                                  void copyPassword(entry.password)
                                }}
                                variant="outline"
                              >
                                <FiCopy className="size-4" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(16,54,56,0.96)_0%,rgba(17,31,32,1)_75%)]">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-primary)]">
                <FiKey className="size-5" />
              </div>
              <CardTitle>History overview</CardTitle>
              <CardDescription>
                Review recent generated passwords, reveal them briefly, copy them,
                or save them as credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard
                label="Entries"
                value={`${history.length}`}
              />
              <MetricCard
                label="Already saved"
                value={`${history.filter((entry) => isEntrySaved(entry)).length}`}
              />
              <MetricCard
                label="Unsaved"
                value={`${history.filter((entry) => !isEntrySaved(entry)).length}`}
              />
              <div className="rounded-[var(--radius-lg)] border border-white/10 bg-black/10 p-4">
                <div className="text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
                  Actions
                </div>
                <Button
                  className="mt-3 w-full"
                  disabled={history.length === 0}
                  onClick={() => {
                    void clearHistory()
                  }}
                  variant="destructive"
                >
                  <FiTrash2 className="size-4" />
                  Clear history
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <SaveGeneratedPasswordModal
        entry={selectedEntry}
        onClose={() => {
          setSelectedEntry(null)
        }}
      />
    </>
  )
}

function MetricCard({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-black/10 p-4">
      <div className="text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[color:var(--color-foreground)]">
        {value}
      </div>
    </div>
  )
}

function HistoryField({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <div className="text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        {label}
      </div>
      <div className="mt-3 break-all text-sm text-[color:var(--color-foreground)]">
        {value}
      </div>
    </div>
  )
}

function SaveGeneratedPasswordModal({
  entry,
  onClose
}: {
  entry: GeneratedPasswordHistoryEntry | null
  onClose: () => void
}) {
  if (!entry) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close save generated password modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-xl">
        <button
          aria-label="Close save generated password modal"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
          onClick={onClose}
          type="button"
        >
          <FiX className="size-4" />
        </button>

        <Formik
          enableReinitialize
          initialValues={getInitialValuesForEntry(entry)}
          onSubmit={async (
            values: credentialValues,
            { resetForm, setSubmitting }: FormikHelpers<credentialValues>
          ) => {
            if (!device.state) {
              setSubmitting(false)
              return
            }

            const loginCredentials = {
              iconUrl: null,
              label: values.label,
              password: values.password,
              url: values.url,
              username: values.username
            }

            loginCredentialsSchema.parse(loginCredentials)

            await device.state.addSecrets([
              {
                createdAt: new Date().toJSON(),
                encrypted: await device.state.encrypt(
                  JSON.stringify(loginCredentials)
                ),
                kind: EncryptedSecretType.LOGIN_CREDENTIALS,
                loginCredentials
              }
            ])

            setSubmitting(false)
            resetForm()
            onClose()
            toast({
              status: 'success',
              title: 'Credential saved'
            })
          }}
          validationSchema={PasswordSchema}
        >
          {({ errors, handleSubmit, isSubmitting, touched }) => (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--color-foreground)]">
                  Save generated password
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                  Convert this history entry into a saved credential.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field name="url">
                  {({ field }: { field: credentialValues & { value: string } }) => (
                    <ModalField
                      error={touched.url ? errors.url : undefined}
                      inputId="url"
                      label="URL"
                    >
                      <Input id="url" {...field} />
                    </ModalField>
                  )}
                </Field>

                <Field name="label">
                  {({ field }: { field: credentialValues & { value: string } }) => (
                    <ModalField
                      error={touched.label ? errors.label : undefined}
                      inputId="label"
                      label="Label"
                    >
                      <Input id="label" {...field} />
                    </ModalField>
                  )}
                </Field>

                <Field name="username">
                  {({ field }: { field: credentialValues & { value: string } }) => (
                    <ModalField
                      error={touched.username ? errors.username : undefined}
                      inputId="username"
                      label="Username"
                    >
                      <Input id="username" {...field} />
                    </ModalField>
                  )}
                </Field>

                <Field name="password">
                  {({ field }: { field: credentialValues & { value: string } }) => (
                    <ModalField
                      error={touched.password ? errors.password : undefined}
                      inputId="password"
                      label="Password"
                    >
                      <Input id="password" {...field} />
                    </ModalField>
                  )}
                </Field>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={onClose} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  Save credential
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  )
}

function ModalField({
  children,
  error,
  inputId,
  label
}: {
  children: React.ReactNode
  error?: string
  inputId: string
  label: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <label
        className="block text-sm font-medium text-[color:var(--color-foreground)]"
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="mt-3">{children}</div>
      {error ? (
        <p className="mt-2 text-xs text-rose-300">{error}</p>
      ) : null}
    </div>
  )
}
