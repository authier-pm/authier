import { MasterDeviceResetSetup } from '@shared/MasterDeviceResetSetup'
import { defaultMasterDeviceResetConfig } from '@shared/masterDeviceResetConfig'
import { useRef, useState } from 'react'
import { Formik, Form, Field, type FormikHelpers } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { setAccessToken } from '@src/util/accessTokenExtension'
import { device } from '@src/background/ExtensionDevice'
import { Trans } from '@lingui/react/macro'
import type { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { getAutofillCredentialsEnabled } from '@src/util/autofillCredentialsPreference'
import {
  bufferToBase64,
  cryptoKeyToString,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import { useRegisterNewUserMutation } from '@shared/graphql/registerNewUser.codegen'
import { useAppToast } from '@src/ExtensionProviders'

const passwordStrength = (password: string) => {
  if (password.length < 8) {
    return 0
  }
  if (password.length < 12) {
    return 1
  }
  if (password.length < 14) {
    return 2
  }
  return 3
}

interface Values {
  password: string
  email: string
}

const PasswordHint = ({ password }: { password: string }) => {
  if (password.length === 0) {
    return null
  }

  const progress = ((passwordStrength(password) + 1) / 4) * 100

  return (
    <div className="mt-2 space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
        <div
          className="h-full bg-[color:var(--color-primary)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {password.length < 8 ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-3 py-2 text-sm text-[color:var(--color-danger)]">
          Password must be at least 8 characters long
        </div>
      ) : null}
      {password.length >= 8 && password.length < 14 ? (
        <div className="rounded-[var(--radius-md)] border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          We recommend using at least 14 characters for best security
        </div>
      ) : null}
      {password.length >= 14 ? (
        <div className="rounded-[var(--radius-md)] border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Good password length!
        </div>
      ) : null}
    </div>
  )
}

export default function Register() {
  const selectedResetConfig = useRef(defaultMasterDeviceResetConfig)
  const [recoveryStep, setRecoveryStep] = useState(false)
  const [resetConfig, setResetConfig] = useState(defaultMasterDeviceResetConfig)
  const [registrationError, setRegistrationError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [register] = useRegisterNewUserMutation()
  const navigate = useNavigate()
  const toast = useAppToast()
  const fireToken = device.fireToken || `web-ext-${crypto.randomUUID()}`

  return (
    <div className="extension-surface mx-auto w-full max-w-[600px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-8 shadow-lg ">
      <div className="mb-6 flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-[color:var(--color-foreground)]">
          Create account
        </h1>
      </div>
      <Formik
        initialValues={{ email: '', password: '' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          if (!recoveryStep) {
            if (values.password.length < 8) {
              toast({
                title: 'Password must be at least 8 characters long',
                status: 'error'
              })
              return
            }
            setRecoveryStep(true)
            setSubmitting(false)
            return
          }
          const userId = crypto.randomUUID()
          const deviceId = await device.getDeviceId()
          const encryptionSalt = self.crypto.getRandomValues(new Uint8Array(16))

          if (values.password.length < 8) {
            toast({
              title: 'Password must be at least 8 characters long',
              status: 'error'
            })
            setSubmitting(false)
            return
          }

          const masterEncryptionKey = await generateEncryptionKey(
            values.password,
            encryptionSalt
          )
          const params = await device.initLocalDeviceAuthSecret(
            masterEncryptionKey,
            encryptionSalt
          )

          const res = await register({
            variables: {
              userId,
              input: {
                masterDeviceResetConfig: selectedResetConfig.current,
                encryptionSalt: bufferToBase64(encryptionSalt),
                email: values.email,
                ...params,
                deviceId,
                devicePlatform: device.platform,
                deviceName: device.generateDeviceName(),
                firebaseToken: fireToken
              }
            }
          })

          const registerResult = res.data?.registerNewUser

          if (!registerResult?.accessToken) {
            setSubmitting(false)
            return
          }

          await setAccessToken(registerResult.accessToken)
          const stringKey = await cryptoKeyToString(masterEncryptionKey)

          const deviceState: IBackgroundStateSerializable = {
            masterEncryptionKey: stringKey,
            userId,
            secrets: [],
            email: values.email,
            deviceName: device.name,
            encryptionSalt: bufferToBase64(encryptionSalt),
            authSecret: params.addDeviceSecret,
            authSecretEncrypted: params.addDeviceSecretEncrypted,
            vaultLockTimeoutSeconds: null,
            autofillTOTPEnabled: null,
            autofillCredentialsEnabled: await getAutofillCredentialsEnabled(),
            autofillForbiddenUrlPatterns: '',
            uiLanguage: null,
            syncTOTP: null,
            theme: 'dark',
            notificationOnVaultUnlock:
              registerResult.user.notificationOnVaultUnlock,
            notificationOnWrongPasswordAttempts:
              registerResult.user.notificationOnWrongPasswordAttempts
          }

          device.save(deviceState)
          navigate('/')
          setSubmitting(false)
        }}
      >
        {(props) =>
          recoveryStep ? (
            <>
              <MasterDeviceResetSetup
                initialConfig={resetConfig}
                email={props.values.email}
                busy={props.isSubmitting}
                onBack={() => setRecoveryStep(false)}
                onSave={async (config) => {
                  setResetConfig(config)
                  selectedResetConfig.current = config
                  await props
                    .submitForm()
                    .catch((error: unknown) =>
                      setRegistrationError(
                        error instanceof Error
                          ? error.message
                          : 'Unable to create account'
                      )
                    )
                }}
              />
              {registrationError && (
                <p role="alert" className="mt-3 text-red-400">
                  {registrationError}
                </p>
              )}
            </>
          ) : (
            <Form className="space-y-4">
              <Field name="email">
                {({ field, form }: any) => (
                  <label className="block">
                    <div className="mb-2 text-sm font-medium">Email</div>
                    <Input {...field} id="Email" type="email" required />
                    {form.errors.email && form.touched.email ? (
                      <div className="mt-1 text-sm text-[color:var(--color-danger)]">
                        {form.errors.email}
                      </div>
                    ) : null}
                  </label>
                )}
              </Field>
              <Field name="password">
                {({ field, form }: any) => (
                  <label className="block">
                    <div className="mb-2 mt-3 text-sm font-medium">
                      Master password
                    </div>
                    <div className="relative">
                      <Input
                        {...field}
                        className="pr-10"
                        placeholder="*******"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[color:var(--color-muted)]"
                        onClick={() => setShowPassword((value) => !value)}
                        type="button"
                      >
                        {showPassword ? (
                          <IoEyeOff className="size-4" />
                        ) : (
                          <IoEye className="size-4" />
                        )}
                      </button>
                    </div>
                    <PasswordHint password={field.value} />
                    {form.errors.password && form.touched.password ? (
                      <div className="mt-1 text-sm text-[color:var(--color-danger)]">
                        {form.errors.password}
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                      it is never sent anywhere-your vault is e2e encrypted
                    </p>
                  </label>
                )}
              </Field>
              <Button
                className="w-full"
                disabled={props.isSubmitting}
                type="submit"
                variant="outline"
              >
                Continue to recovery setup
              </Button>
              <p className="p-2 text-center text-xs text-[color:var(--color-muted)]">
                By signing up you agree to our Terms of Service
              </p>
            </Form>
          )
        }
      </Formik>
      <Link
        className="pt-3 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        to="/"
      >
        <Trans>Already have an account?</Trans>
      </Link>
    </div>
  )
}
