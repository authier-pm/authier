import { useEffect, useState, type ReactNode } from 'react'
import { Formik, FormikHelpers, useField } from 'formik'
import { useNavigate, useParams } from 'react-router-dom'
import { formatRelative } from 'date-fns'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiX
} from 'react-icons/fi'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { Input } from '@src/components/ui/input'
import { Tooltip } from '@src/components/ui/tooltip'
import { useAppToast } from '@src/ExtensionProviders'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { EditFormButtons } from './EditFormButtons'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import {
  credentialValues,
  PasswordSchema,
  TOTPSchema,
  totpValues
} from '@shared/formikSharedTypes'
import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { useRemoveWebInputMutation } from './VaultItemSettings.codegen'
import { WebInputType, EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { getWebInputsForUrlOfKinds } from '@src/background/getWebInputsForUrl'
import { evaluatePasswordStrength } from './evaluatePasswordStrength'
import { cn } from '@src/lib/cn'

const navigateBack = (navigate: ReturnType<typeof useNavigate>) => {
  const canGoBack = window.history.length > 1

  if (canGoBack) {
    navigate(-1)
    return
  }

  navigate('/')
}

const strengthClassNameByColor: Record<string, string> = {
  green: 'bg-emerald-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  yellow: 'bg-yellow-400'
}

const loginWebInputKinds = [
  WebInputType.USERNAME_OR_EMAIL,
  WebInputType.PASSWORD,
  WebInputType.EMAIL,
  WebInputType.USERNAME,
  WebInputType.NEW_PASSWORD,
  WebInputType.NEW_PASSWORD_CONFIRMATION,
  WebInputType.SUBMIT_BUTTON
]

function LoginSecret({ secretProps }: { secretProps: ILoginSecret }) {
  const navigate = useNavigate()
  const toast = useAppToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [removeWebInput] = useRemoveWebInputMutation()
  const webInputs = getWebInputsForUrlOfKinds(
    secretProps.loginCredentials.url,
    loginWebInputKinds
  )

  return (
    <SecretDetailLayout
      createdAt={secretProps.createdAt}
      kindLabel="Credential"
      navigate={navigate}
      title={secretProps.loginCredentials.label || secretProps.loginCredentials.url}
      webInputs={webInputs}
      onRemoveWebInput={async (id) => {
        await removeWebInput({ variables: { id } })
        toast({
          title: t`Web input removed`,
          status: 'success'
        })

        device.setWebInputs(
          device.state?.webInputs.filter((input) => input.id !== id) ?? []
        )
      }}
    >
      <Formik
        enableReinitialize
        initialValues={{
          label: secretProps.loginCredentials.label,
          password: secretProps.loginCredentials.password,
          url: secretProps.loginCredentials.url,
          username: secretProps.loginCredentials.username
        }}
        onSubmit={async (
          values: credentialValues,
          { setSubmitting }: FormikHelpers<credentialValues>
        ) => {
          const secret = device.state?.secrets.find(
            ({ id }) => id === secretProps.id
          )

          if (secret && device.state) {
            secret.encrypted = await device.state.encrypt(
              JSON.stringify({
                iconUrl: secretProps.loginCredentials.iconUrl ?? null,
                label: values.label,
                password: values.password,
                url: values.url,
                username: values.username
              })
            )

            await updateSecret({
              variables: {
                id: secretProps.id,
                patch: {
                  encrypted: secret.encrypted,
                  kind: secretProps.kind
                }
              }
            })

            await device.state.save()
            setSubmitting(false)
          }
        }}
        validationSchema={PasswordSchema}
      >
        {({ handleSubmit, setFieldValue, values }) => {
          const levelOfPassword = evaluatePasswordStrength(values.password)

          return (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                handleSubmit()
              }}
            >
              <TextField label="URL" name="url" />
              <TextField label="Label" name="label" />
              <TextField label="Username" name="username" />

              <div className="space-y-2">
                <PasswordField
                  copyLabel={t`Copy password`}
                  label="Password"
                  name="password"
                  onCopy={(value) => {
                    navigator.clipboard.writeText(value)
                    toast({
                      title: t`Copied to clipboard`,
                      status: 'success'
                    })
                  }}
                  onToggleGenerator={() => {
                    setIsGeneratorOpen((currentValue) => !currentValue)
                  }}
                  onToggleVisibility={() => {
                    setShowPassword((currentValue) => !currentValue)
                  }}
                  showValue={showPassword}
                  toggleGeneratorLabel={
                    isGeneratorOpen ? 'Hide generator' : 'Show generator'
                  }
                />
                <PasswordStrengthBar
                  color={levelOfPassword.color ?? 'red'}
                  label={levelOfPassword.value}
                  level={levelOfPassword.id}
                />
              </div>

              <PasswordGenerator
                isOpen={isGeneratorOpen}
                onGenerate={(generatedPassword) => {
                  setFieldValue('password', generatedPassword)
                  setShowPassword(true)
                }}
              />

              {secretProps.loginCredentials.parseError ? (
                <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-4 py-3 text-sm text-[color:var(--color-danger-foreground)]">
                  <div className="font-medium">
                    <Trans>Failed to parse this secret</Trans>
                  </div>
                  <div className="mt-2 break-all text-xs">
                    {JSON.stringify(secretProps.loginCredentials.parseError)}
                  </div>
                </div>
              ) : null}

              <EditFormButtons secret={secretProps} />
            </form>
          )
        }}
      </Formik>
    </SecretDetailLayout>
  )
}

function TotpSecret({ secretProps }: { secretProps: ITOTPSecret }) {
  const navigate = useNavigate()
  const toast = useAppToast()
  const [showSecret, setShowSecret] = useState(false)
  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [removeWebInput] = useRemoveWebInputMutation()
  const webInputs = secretProps.totp.url
    ? getWebInputsForUrlOfKinds(secretProps.totp.url, [WebInputType.TOTP])
    : []

  return (
    <SecretDetailLayout
      createdAt={secretProps.createdAt}
      kindLabel="TOTP"
      navigate={navigate}
      title={secretProps.totp.label || secretProps.totp.url || 'TOTP'}
      webInputs={webInputs}
      onRemoveWebInput={async (id) => {
        await removeWebInput({ variables: { id } })
        toast({
          title: t`Web input removed`,
          status: 'success'
        })

        device.setWebInputs(
          device.state?.webInputs.filter((input) => input.id !== id) ?? []
        )
      }}
    >
      <Formik
        initialValues={{
          digits: secretProps.totp.digits,
          label: secretProps.totp.label,
          period: secretProps.totp.period,
          secret: secretProps.totp.secret,
          url: secretProps.totp.url ?? ''
        }}
        onSubmit={async (
          values: totpValues,
          { setSubmitting }: FormikHelpers<totpValues>
        ) => {
          const secret = device.state?.secrets.find(
            ({ id }) => id === secretProps.id
          )

          if (secret && device.state) {
            secret.encrypted = await device.state.encrypt(
              JSON.stringify({
                ...values,
                digits: Number(values.digits),
                iconUrl: secretProps.totp.iconUrl ?? null,
                period: Number(values.period)
              })
            )

            await updateSecret({
              variables: {
                id: secret.id,
                patch: {
                  encrypted: secret.encrypted,
                  kind: secret.kind
                }
              }
            })

            await device.state.save()
            setSubmitting(false)
          }
        }}
        validationSchema={TOTPSchema}
      >
        {({ handleSubmit }) => (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <TextField label="URL" name="url" />
            <TextField label="Label" name="label" />
            <PasswordField
              copyLabel={t`Copy shared secret`}
              label="Secret"
              name="secret"
              onCopy={(value) => {
                navigator.clipboard.writeText(value)
                toast({
                  title: t`Copied to clipboard`,
                  status: 'success'
                })
              }}
              onToggleVisibility={() => {
                setShowSecret((currentValue) => !currentValue)
              }}
              showValue={showSecret}
              toggleGeneratorLabel={null}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label="Digits" name="digits" />
              <NumberField label="Period" name="period" />
            </div>
            <EditFormButtons secret={secretProps} />
          </form>
        )}
      </Formik>
    </SecretDetailLayout>
  )
}

export const VaultItemSettings = () => {
  const [secret, setSecret] = useState<
    ITOTPSecret | ILoginSecret | undefined | null
  >(null)
  const params = useParams()

  useEffect(() => {
    let isMounted = true

    async function loadSecret() {
      const nextSecret = await device.state?.getSecretDecryptedById(
        params.secretId as string
      )

      if (isMounted) {
        setSecret(nextSecret)
      }
    }

    loadSecret()

    return () => {
      isMounted = false
    }
  }, [params.secretId])

  if (!device.state && !secret) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md border-white/10 extension-surface">
          <CardContent className="p-6 text-center text-sm text-[color:var(--color-muted)]">
            Loading secret...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!secret) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md border-white/10 extension-surface">
          <CardContent className="p-6 text-center text-sm text-[color:var(--color-muted)]">
            Could not find this secret, it may be deleted.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (secret.kind === EncryptedSecretType.TOTP) {
    return <TotpSecret secretProps={secret} />
  }

  if (secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS) {
    return <LoginSecret secretProps={secret} />
  }

  return null
}

function SecretDetailLayout({
  children,
  createdAt,
  kindLabel,
  navigate,
  onRemoveWebInput,
  title,
  webInputs
}: {
  children: ReactNode
  createdAt: string
  kindLabel: string
  navigate: ReturnType<typeof useNavigate>
  onRemoveWebInput: (id: number) => Promise<void>
  title: string
  webInputs: Array<{
    domPath: string
    id: number
    kind: WebInputType
    url: string
  }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
            {kindLabel}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--color-foreground)]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Edit the secret values and matching autofill mappings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              navigateBack(navigate)
            }}
            type="button"
            variant="outline"
          >
            <FiArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            aria-label="Close secret detail"
            onClick={() => {
              navigateBack(navigate)
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <FiX className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-white/10 extension-surface">
          <CardHeader>
            <CardTitle>Secret details</CardTitle>
            <CardDescription>
              Update the stored values and save when you are done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">{children}</CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 extension-surface">
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetadataRow label="Created">
                {formatRelative(new Date(createdAt), new Date())}
              </MetadataRow>
              <MetadataRow label="Web inputs">{webInputs.length}</MetadataRow>
            </CardContent>
          </Card>

          <Card className="border-white/10 extension-surface">
            <CardHeader>
              <CardTitle className="text-lg">
                <Trans>Matching Web inputs</Trans>
              </CardTitle>
              <CardDescription>
                Remove stale autofill mappings if they no longer match this
                secret.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webInputs.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] px-4 py-5 text-sm text-[color:var(--color-muted)]">
                  <Trans>No matching web inputs found</Trans>
                </div>
              ) : (
                <div className="space-y-3">
                  {webInputs.map((webInput) => (
                    <div
                      className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-3"
                      key={webInput.id}
                    >
                      <div className="text-xs font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
                        {webInput.kind}
                      </div>
                      <div className="mt-2 break-all text-sm text-[color:var(--color-foreground)]">
                        {webInput.domPath}
                      </div>
                      <div className="mt-1 break-all text-xs text-[color:var(--color-muted)]">
                        {webInput.url}
                      </div>
                      <Button
                        className="mt-3"
                        onClick={async () => {
                          await onRemoveWebInput(webInput.id)
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetadataRow({
  children,
  label
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-2">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="text-right text-[color:var(--color-foreground)]">
        {children}
      </span>
    </div>
  )
}

function TextField({
  label,
  name,
  type = 'text'
}: {
  label: string
  name: string
  type?: 'text' | 'password' | 'url'
}) {
  const [field, meta] = useField<string>(name)

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[color:var(--color-foreground)]">
        {label}
      </span>
      <Input
        {...field}
        className={cn(
          meta.touched && meta.error
            ? 'border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/30'
            : undefined
        )}
        type={type}
      />
      {meta.touched && meta.error ? (
        <p className="text-xs text-[color:var(--color-danger)]">{meta.error}</p>
      ) : null}
    </label>
  )
}

function NumberField({ label, name }: { label: string; name: string }) {
  const [field, meta, helpers] = useField<number | string>(name)

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[color:var(--color-foreground)]">
        {label}
      </span>
      <Input
        className={cn(
          meta.touched && meta.error
            ? 'border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/30'
            : undefined
        )}
        min={0}
        type="number"
        value={field.value}
        onChange={(event) => {
          const nextValue = Number.parseInt(event.target.value, 10)
          helpers.setValue(Number.isNaN(nextValue) ? 0 : nextValue)
        }}
      />
      {meta.touched && meta.error ? (
        <p className="text-xs text-[color:var(--color-danger)]">{meta.error}</p>
      ) : null}
    </label>
  )
}

function PasswordField({
  copyLabel,
  label,
  name,
  onCopy,
  onToggleGenerator,
  onToggleVisibility,
  showValue,
  toggleGeneratorLabel
}: {
  copyLabel: string
  label: string
  name: string
  onCopy: (value: string) => void
  onToggleGenerator?: () => void
  onToggleVisibility: () => void
  showValue: boolean
  toggleGeneratorLabel: string | null
}) {
  const [field, meta] = useField<string>(name)

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[color:var(--color-foreground)]">
        {label}
      </span>
      <div className="relative">
        <Input
          {...field}
          className={cn(
            'pr-28',
            meta.touched && meta.error
              ? 'border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/30'
              : undefined
          )}
          type={showValue ? 'text' : 'password'}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          <Tooltip content={copyLabel}>
            <Button
              aria-label={copyLabel}
              onClick={() => {
                onCopy(field.value)
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <FiCopy className="size-4" />
            </Button>
          </Tooltip>
          <Button
            aria-label={showValue ? 'Hide value' : 'Show value'}
            onClick={onToggleVisibility}
            size="icon"
            type="button"
            variant="ghost"
          >
            {showValue ? (
              <FiEyeOff className="size-4" />
            ) : (
              <FiEye className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {toggleGeneratorLabel && onToggleGenerator ? (
          <Button
            onClick={onToggleGenerator}
            size="sm"
            type="button"
            variant="outline"
          >
            {toggleGeneratorLabel.includes('Hide') ? (
              <FiChevronUp className="size-4" />
            ) : (
              <FiChevronDown className="size-4" />
            )}
            {toggleGeneratorLabel}
          </Button>
        ) : null}
      </div>

      {meta.touched && meta.error ? (
        <p className="text-xs text-[color:var(--color-danger)]">{meta.error}</p>
      ) : null}
    </label>
  )
}

function PasswordStrengthBar({
  color,
  label,
  level
}: {
  color: string
  label: string
  level: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
        <span>Password strength</span>
        <span>{label}</span>
      </div>
      <div className="h-2 rounded-full bg-[color:var(--color-card)]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            strengthClassNameByColor[color] ?? strengthClassNameByColor.red
          )}
          style={{ width: `${(Math.max(level, 0) / 3) * 100}%` }}
        />
      </div>
    </div>
  )
}
