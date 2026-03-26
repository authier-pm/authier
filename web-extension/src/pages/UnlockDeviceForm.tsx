import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IoEye, IoEyeOff, IoLockClosed } from 'react-icons/io5'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Button } from '@src/components/ui/button'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Input } from '@src/components/ui/input'
import { toast } from '@src/ExtensionProviders'
import {
  cryptoKeyToString,
  decryptDeviceSecretWithPassword
} from '@util/generateEncryptionKey'

interface FormValues {
  password: string
}

export function UnlockDeviceForm({ onUnlocked }: { onUnlocked: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormValues>({
    defaultValues: {
      password: ''
    }
  })

  const password = watch('password')
  const { setDeviceState, lockedState, device } = useContext(DeviceStateContext)

  useEffect(() => {
    if (lockedState === null) {
      onUnlocked()
    }
  }, [lockedState, onUnlocked])

  if (!lockedState) {
    return null
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      const { addDeviceSecret, masterEncryptionKey } =
        await decryptDeviceSecretWithPassword(values.password, lockedState)

      if (addDeviceSecret !== lockedState.authSecret) {
        throw new Error(t`Incorrect password`)
      }

      setDeviceState({
        masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
        ...lockedState
      })

      if (lockedState.vaultLockTimeoutSeconds) {
        device.startLockInterval(lockedState.vaultLockTimeoutSeconds)
      }

      onUnlocked()
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message ===
            'DOMException: The operation failed for an operation-specific reason'
            ? 'Incorrect password'
            : err.message
          : 'Incorrect password'

      toast({
        title: errorMessage,
        status: 'error',
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-w-[315px] flex-col px-4 py-5">
      <div className="mb-4 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-accent)]/30">
          <IoLockClosed className="size-8 text-[color:var(--color-primary)]" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block">
          <div className="mb-2 text-base font-semibold text-[color:var(--color-foreground)]">
            Re-enter your Master Password
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required'
              })}
            />
            <button
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[color:var(--color-muted)]"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              type="button"
            >
              {showPassword ? (
                <IoEyeOff className="size-4" />
              ) : (
                <IoEye className="size-4" />
              )}
            </button>
          </div>
          {errors.password?.message ? (
            <div className="mt-1 text-sm text-[color:var(--color-danger)]">
              {errors.password.message}
            </div>
          ) : null}
        </label>

        <Button
          className="w-full"
          disabled={!password || password.length < 3 || isSubmitting}
          type="submit"
          variant="outline"
        >
          <Trans>Unlock vault</Trans>
        </Button>
      </form>
    </div>
  )
}
