import { useContext } from 'react'
import { Field, Formik, type FormikHelpers } from 'formik'
import { Trans } from '@lingui/react/macro'
import {
  SyncSettingsDocument,
  useUpdateSettingsMutation
} from '@shared/graphql/Settings.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
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
  uiLanguage: string
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  syncTOTP: boolean
  notificationOnWrongPasswordAttempts: number
  notificationOnVaultUnlock: boolean
}

export default function Security() {
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  const options = useVaultLockTimeoutOptions()

  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }]
  })

  if (!deviceState) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Security behavior</CardTitle>
        <CardDescription>
          Control locking, language, autofill, and vault notifications for this
          device.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Formik
          initialValues={{
            autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
            autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
            uiLanguage: deviceState.uiLanguage,
            syncTOTP: deviceState.syncTOTP,
            vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds,
            notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
            notificationOnWrongPasswordAttempts:
              deviceState.notificationOnWrongPasswordAttempts
          }}
          onSubmit={async (
            values: Values,
            { resetForm, setSubmitting }: FormikHelpers<Values>
          ) => {
            const config = {
              ...values,
              vaultLockTimeoutSeconds: Number.parseInt(
                values.vaultLockTimeoutSeconds.toString(),
                10
              )
            }

            await updateSettings({
              variables: {
                config
              }
            })
            setSecuritySettings(config)
            resetForm({ values: config })
            setSubmitting(false)
          }}
        >
          {({ dirty, handleSubmit, isSubmitting, setFieldValue, values }) => (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="vaultLockTimeoutSeconds">
                  {() => (
                    <FormField
                      description="Automatically locks the vault after a period of inactivity."
                      label="Lock time"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="vaultLockTimeoutSeconds"
                        name="vaultLockTimeoutSeconds"
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

                <Field name="uiLanguage">
                  {() => (
                    <FormField
                      description="Choose the language used across the vault UI."
                      label="Language"
                    >
                      <select
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                        id="uiLanguage"
                        name="uiLanguage"
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
              </div>

              <div className="grid gap-4">
                <SettingToggle
                  checked={values.autofillCredentialsEnabled}
                  description="Allow saved credentials to be offered for autofill."
                  label="Credentials autofill"
                  onCheckedChange={(checked) => {
                    setFieldValue('autofillCredentialsEnabled', checked)
                  }}
                />
                <SettingToggle
                  checked={values.autofillTOTPEnabled}
                  description="Enable one-time password autofill where supported."
                  label="TOTP autofill"
                  onCheckedChange={(checked) => {
                    setFieldValue('autofillTOTPEnabled', checked)
                  }}
                />
                <SettingToggle
                  checked={values.syncTOTP}
                  description="Keep your one-time password data synced to this device."
                  label="2FA sync"
                  onCheckedChange={(checked) => {
                    setFieldValue('syncTOTP', checked)
                  }}
                />
                <SettingToggle
                  checked={values.notificationOnVaultUnlock}
                  description="Show a notification whenever the vault is unlocked."
                  label="Notification on vault unlock"
                  onCheckedChange={(checked) => {
                    setFieldValue('notificationOnVaultUnlock', checked)
                  }}
                />
              </div>

              <Field name="notificationOnWrongPasswordAttempts">
                {() => (
                  <FormField
                    description="Set how many wrong password attempts trigger a notification."
                    label="Wrong password threshold"
                  >
                    <input
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30"
                      id="notificationOnWrongPasswordAttempts"
                      min={0}
                      name="notificationOnWrongPasswordAttempts"
                      onChange={(event) => {
                        setFieldValue(
                          'notificationOnWrongPasswordAttempts',
                          Number.parseInt(event.target.value || '0', 10)
                        )
                      }}
                      type="number"
                      value={values.notificationOnWrongPasswordAttempts}
                    />
                  </FormField>
                )}
              </Field>

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
