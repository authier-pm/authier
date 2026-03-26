import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { FiAlertTriangle, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi'
import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'
import { useDevicesRequestsQuery } from '@shared/graphql/AccountDevices.codegen'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { Input } from '@src/components/ui/input'
import { useAppToast } from '@src/ExtensionProviders'
import {
  base64ToBuffer,
  cryptoKeyToString,
  decryptDeviceSecretWithPassword,
  generateEncryptionKey
} from '@src/util/generateEncryptionKey'
import {
  useChangeMasterPasswordMutation,
  useDeleteAccountMutation
} from './Account.codegen'

const AccountFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  currPassword: z.string().min(process.env.NODE_ENV === 'development' ? 1 : 8, {
    message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
  }),
  newPassword: z.string().min(process.env.NODE_ENV === 'development' ? 1 : 8, {
    message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
  }),
  confirmPassword: z.string().min(
    process.env.NODE_ENV === 'development' ? 1 : 8,
    {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    }
  )
})

export default function Account() {
  const email = device.state?.email
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const [deleteAccount] = useDeleteAccountMutation()
  const toast = useAppToast()
  const [showPasswords, setShowPasswords] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: devicesRequests } = useDevicesRequestsQuery({
    fetchPolicy: 'cache-and-network'
  })

  const isMasterDevice = device.id === devicesRequests?.me.masterDeviceId

  const {
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
    handleSubmit,
    register,
    reset
  } = useForm<z.infer<typeof AccountFormSchema>>({
    defaultValues: {
      confirmPassword: '',
      currPassword: '',
      email: email ?? '',
      newPassword: ''
    },
    mode: 'onChange',
    resolver: zodResolver(AccountFormSchema)
  })

  useEffect(() => {
    reset({
      confirmPassword: '',
      currPassword: '',
      email: email ?? '',
      newPassword: ''
    })
  }, [email, isSubmitSuccessful, reset])

  if (!email) {
    return null
  }

  async function onSubmit(data: z.infer<typeof AccountFormSchema>) {
    if (data.newPassword !== data.confirmPassword) {
      toast({ status: 'error', title: t`Passwords do not match` })
      return
    }

    const { addDeviceSecret } = await decryptDeviceSecretWithPassword(
      data.currPassword,
      device.state as IBackgroundStateSerializable
    )

    if (addDeviceSecret !== device.state?.authSecret) {
      toast({ status: 'error', title: t`Wrong password` })
      return
    }

    const state = device.state

    if (!state) {
      toast({ status: 'error', title: t`Wrong password` })
      return
    }

    const newEncryptionKey = await generateEncryptionKey(
      data.newPassword,
      base64ToBuffer(state.encryptionSalt)
    )

    const decryptionChallenge = await deviceDecryptionChallenge({
      variables: {
        deviceInput: {
          id: device.id as string,
          name: device.name,
          platform: device.platform
        },
        email: data.email
      }
    })

    const newDeviceSecretsPair = await device.initLocalDeviceAuthSecret(
      newEncryptionKey,
      base64ToBuffer(state.encryptionSalt)
    )

    await changePassword({
      variables: {
        addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
        addDeviceSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
        decryptionChallengeId: decryptionChallenge.data?.deviceDecryptionChallenge
          ?.id as number,
        secrets: await device.serializeSecrets(state.secrets, data.newPassword)
      }
    })

    const deviceState: IBackgroundStateSerializable = {
      ...state,
      authSecret: newDeviceSecretsPair.addDeviceSecret,
      authSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
      masterEncryptionKey: await cryptoKeyToString(newEncryptionKey)
    }

    device.save(deviceState)

    toast({
      status: 'success',
      title: t`Password changed, all your other devices will be logged out and you will need to log in again`
    })
  }

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Vault account</CardTitle>
          <CardDescription>
            Update your master password and keep account ownership anchored to
            the correct device.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
            <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
              Account email
            </div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--color-foreground)]">
              {email}
            </div>
            <div className="mt-2 text-sm text-[color:var(--color-muted)]">
              {isMasterDevice ? (
                'This device can change the vault password.'
              ) : (
                <Trans>
                  You can only change the password on the master device, "{device.name}" is just a regular device
                </Trans>
              )}
            </div>
          </div>

          {isMasterDevice ? (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <FormField
                error={errors.email?.message}
                label="Email"
              >
                <Input type="email" {...register('email')} />
              </FormField>

              <PasswordField
                error={errors.currPassword?.message}
                label={t`Current password`}
                registration={register('currPassword')}
                showPasswords={showPasswords}
                togglePasswords={() => {
                  setShowPasswords((currentValue) => !currentValue)
                }}
              />

              <PasswordField
                error={errors.newPassword?.message}
                label={t`Set new master password`}
                registration={register('newPassword')}
                showPasswords={showPasswords}
                togglePasswords={() => {
                  setShowPasswords((currentValue) => !currentValue)
                }}
              />

              <PasswordField
                error={errors.confirmPassword?.message}
                label={t`Confirm new password`}
                registration={register('confirmPassword')}
                showPasswords={showPasswords}
                togglePasswords={() => {
                  setShowPasswords((currentValue) => !currentValue)
                }}
              />

              <div className="flex justify-end">
                <Button disabled={isSubmitting || !isDirty} type="submit">
                  <Trans>Submit</Trans>
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-rose-400/20 bg-[linear-gradient(180deg,rgba(76,17,27,0.14)_0%,rgba(20,18,20,1)_100%)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <FiAlertTriangle className="size-4" />
            </div>
            <div>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                This action removes your account and clears the local vault state.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-rose-400/15 bg-black/15 p-4 text-sm leading-6 text-[color:var(--color-muted)]">
            Delete the account only when you are certain you no longer need any
            synced data. Make sure you have exported anything you want to keep.
          </div>

          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-rose-400/20 bg-rose-400/8 p-4">
              <div className="text-sm text-[color:var(--color-foreground)]">
                Are you sure? This cannot be undone.
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={() => {
                    setConfirmDelete(false)
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await deleteAccount()
                    await device.clearAndReload()
                  }}
                  variant="destructive"
                >
                  <FiTrash2 className="size-4" />
                  Delete account
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                setConfirmDelete(true)
              }}
              variant="destructive"
            >
              <FiTrash2 className="size-4" />
              <Trans>Delete your account</Trans>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FormField({
  children,
  error,
  label
}: {
  children: React.ReactNode
  error?: string
  label: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
      <label className="block text-sm font-medium text-[color:var(--color-foreground)]">
        {label}
      </label>
      <div className="mt-3">{children}</div>
      {error ? (
        <p className="mt-2 text-xs text-rose-300">{error}</p>
      ) : null}
    </div>
  )
}

function PasswordField({
  error,
  label,
  registration,
  showPasswords,
  togglePasswords
}: {
  error?: string
  label: string
  registration: ReturnType<typeof useForm<z.infer<typeof AccountFormSchema>>>['register'] extends (
    ...args: never[]
  ) => infer T
    ? T
    : never
  showPasswords: boolean
  togglePasswords: () => void
}) {
  return (
    <FormField error={error} label={label}>
      <div className="relative">
        <Input
          className="pr-11"
          type={showPasswords ? 'text' : 'password'}
          {...registration}
        />
        <button
          aria-label={showPasswords ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
          onClick={(event) => {
            event.preventDefault()
            togglePasswords()
          }}
          type="button"
        >
          {showPasswords ? (
            <FiEyeOff className="size-4" />
          ) : (
            <FiEye className="size-4" />
          )}
        </button>
      </div>
    </FormField>
  )
}
