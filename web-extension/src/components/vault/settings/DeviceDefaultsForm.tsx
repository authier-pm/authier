import { Field, Formik, type FormikHelpers } from 'formik'
import { Trans } from '@lingui/react/macro'
import {
  DefaultSettingsDocument,
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation,
  useUpdateMasterDeviceResetTimeoutMutation
} from '@shared/graphql/DefaultSettings.codegen'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { Switch } from '@src/components/ui/switch'
import { useVaultLockTimeoutOptions } from '@src/util/useVaultLockTimeoutOptions'

interface Values {
  vaultLockTimeoutSeconds: number
  deviceRecoveryCooldownMinutes: number
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  syncTOTP: boolean
  uiLanguage: string
  theme: string
}

export function DeviceDefaultsForm() {
  const { data, error, loading } = useDefaultSettingsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const [updateDefaultSettings] = useUpdateDefaultDeviceSettingsMutation({
    refetchQueries: [{ query: DefaultSettingsDocument, variables: {} }]
  })
  const [updateMasterDeviceResetTimeout] =
    useUpdateMasterDeviceResetTimeoutMutation({
      refetchQueries: [{ query: DefaultSettingsDocument, variables: {} }]
    })
  const options = useVaultLockTimeoutOptions()
  const masterDeviceResetTimeoutOptions = [
    { label: '1 hour', value: 60 },
    { label: '6 hours', value: 360 },
    { label: '12 hours', value: 720 },
    { label: '24 hours', value: 1440 },
    { label: '3 days', value: 4320 },
    { label: '7 days', value: 10080 },
    { label: '14 days', value: 20160 },
    { label: '30 days', value: 43200 }
  ]

  if (loading && !data) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Default device policy</CardTitle>
          <CardDescription>Loading default device settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="size-10 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Default device policy</CardTitle>
          <CardDescription>
            We could not load your default settings right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-lg)] border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-[color:var(--color-muted)]">
            Try refreshing the page or opening this tab again.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Default device policy</CardTitle>
        <CardDescription>
          Define how newly paired devices should behave before you tune them
          individually.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Formik
          initialValues={{
            autofillTOTPEnabled:
              data.me.defaultDeviceSettings.autofillTOTPEnabled,
            autofillCredentialsEnabled:
              data.me.defaultDeviceSettings.autofillCredentialsEnabled,
            syncTOTP: data.me.defaultDeviceSettings.syncTOTP,
            vaultLockTimeoutSeconds:
              data.me.defaultDeviceSettings.vaultLockTimeoutSeconds,
            deviceRecoveryCooldownMinutes: data.me.deviceRecoveryCooldownMinutes,
            theme: data.me.defaultDeviceSettings.theme,
            uiLanguage: data.me.uiLanguage
          }}
          onSubmit={async (
            values: Values,
            { resetForm, setSubmitting }: FormikHelpers<Values>
          ) => {
            const config = {
              autofillTOTPEnabled: values.autofillTOTPEnabled,
              autofillCredentialsEnabled: values.autofillCredentialsEnabled,
              syncTOTP: values.syncTOTP,
              theme: values.theme,
              uiLanguage: values.uiLanguage,
              vaultLockTimeoutSeconds: Number.parseInt(
                values.vaultLockTimeoutSeconds.toString(),
                10
              )
            }

            const deviceRecoveryCooldownMinutes = Number.parseInt(
              values.deviceRecoveryCooldownMinutes.toString(),
              10
            )

            await updateDefaultSettings({
              variables: {
                config
              }
            })
            await updateMasterDeviceResetTimeout({
              variables: {
                deviceRecoveryCooldownMinutes
              }
            })
            resetForm({
              values: {
                ...config,
                deviceRecoveryCooldownMinutes
              }
            })
            setSubmitting(false)
          }}
        >
          {({ dirty, handleSubmit, isSubmitting, setFieldValue, values }) => (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="vaultLockTimeoutSeconds">
                  {() => (
                    <FormField
                      description="Default inactivity timeout for every new device."
                      label="Lock time"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="vaultLockTimeoutSeconds"
                        onChange={(event) => {
                          setFieldValue(
                            'vaultLockTimeoutSeconds',
                            Number.parseInt(event.target.value, 10)
                          )
                        }}
                        value={values.vaultLockTimeoutSeconds}
                      >
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                </Field>

                <Field name="deviceRecoveryCooldownMinutes">
                  {() => (
                    <FormField
                      description="How long a master device reset must wait before it can be completed."
                      label="Master device reset timeout"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="deviceRecoveryCooldownMinutes"
                        onChange={(event) => {
                          setFieldValue(
                            'deviceRecoveryCooldownMinutes',
                            Number.parseInt(event.target.value, 10)
                          )
                        }}
                        value={values.deviceRecoveryCooldownMinutes}
                      >
                        {masterDeviceResetTimeoutOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                </Field>

                <Field name="uiLanguage">
                  {() => (
                    <FormField
                      description="Default UI language for future devices."
                      label="Language"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="uiLanguage"
                        onChange={(event) => {
                          setFieldValue('uiLanguage', event.target.value)
                        }}
                        value={values.uiLanguage}
                      >
                        <option value="en">English</option>
                        <option value="cs">Cesky</option>
                      </select>
                    </FormField>
                  )}
                </Field>

                <Field name="theme">
                  {() => (
                    <FormField
                      description="Default appearance applied to newly paired devices."
                      label="Theme"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="theme"
                        onChange={(event) => {
                          setFieldValue('theme', event.target.value)
                        }}
                        value={values.theme}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </FormField>
                  )}
                </Field>
              </div>

              <div className="grid gap-4">
                <SettingToggle
                  checked={values.autofillCredentialsEnabled}
                  description="Offer saved credentials for autofill on new devices."
                  label="Credentials autofill"
                  onCheckedChange={(checked) => {
                    setFieldValue('autofillCredentialsEnabled', checked)
                  }}
                />
                <SettingToggle
                  checked={values.autofillTOTPEnabled}
                  description="Enable one-time password autofill by default."
                  label="TOTP autofill"
                  onCheckedChange={(checked) => {
                    setFieldValue('autofillTOTPEnabled', checked)
                  }}
                />
                <SettingToggle
                  checked={values.syncTOTP}
                  description="Sync TOTP data to newly added devices."
                  label="2FA sync"
                  onCheckedChange={(checked) => {
                    setFieldValue('syncTOTP', checked)
                  }}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  disabled={isSubmitting || !dirty}
                  type="submit"
                  variant="primary"
                >
                  <Trans>Save</Trans>
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  )
}

function FormField({
  children,
  description,
  label
}: {
  children: React.ReactNode
  description?: string
  label: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <label className="block text-sm font-medium text-[color:var(--color-foreground)]">
        {label}
      </label>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
          {description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  )
}

function SettingToggle({
  checked,
  description,
  label,
  onCheckedChange
}: {
  checked: boolean
  description: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <div>
        <div className="text-sm font-medium text-[color:var(--color-foreground)]">
          {label}
        </div>
        <div className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
          {description}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
