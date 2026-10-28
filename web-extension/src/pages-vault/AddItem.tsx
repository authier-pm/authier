import { useContext, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiKey, FiShield } from 'react-icons/fi'
import { Trans } from '@lingui/react/macro'
import { AddLogin } from '@src/components/vault/addItem/AddLogin'
import { AddTOTP } from '@src/components/vault/addItem/AddTOTP'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'

export const AddItem = () => {
  const [type, setType] = useState<'login' | 'totp'>('login')
  const { loginCredentials, TOTPSecrets, deviceState } =
    useContext(DeviceStateContext)
  const { data, loading } = useLimitsQuery()

  if (loading) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center"
        role="status"
        aria-label="Loading account limits"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  const totpLimitReached = (data?.me.TOTPlimit ?? 0) <= TOTPSecrets.length
  const passwordLimitReached =
    (data?.me.loginCredentialsLimit ?? 0) <= loginCredentials.length

  return (
    <div className="extension-scrollbar min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-1 py-2 sm:py-5">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          to="/"
        >
          <FiArrowLeft aria-hidden className="size-4" />
          Back to vault
        </Link>
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            New vault item
          </h1>
          <p className="mt-2 text-sm text-muted">
            A safer home for your sign-in details.
          </p>
        </header>

        {totpLimitReached || passwordLimitReached ? (
          <p
            className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm"
            role="status"
          >
            <Trans>
              You have reached your account limit. Go to{' '}
              <Link className="underline" to="/account-limits">
                Account Limits
              </Link>{' '}
              to upgrade your account.
            </Trans>
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-black/10">
          {deviceState?.syncTOTP && (
            <fieldset className="flex gap-2 border-b border-border/60 bg-background/20 px-5 py-4 sm:px-7">
              <legend className="sr-only">Item type</legend>
              <ItemTypeOption
                checked={type === 'login'}
                disabled={passwordLimitReached}
                onSelect={() => setType('login')}
                value="login"
              >
                <FiKey aria-hidden className="size-4" /> Login
              </ItemTypeOption>
              <ItemTypeOption
                checked={type === 'totp'}
                disabled={totpLimitReached}
                onSelect={() => setType('totp')}
                value="totp"
              >
                <FiShield aria-hidden className="size-4" /> Authenticator
              </ItemTypeOption>
            </fieldset>
          )}
          {type === 'totp' && deviceState?.syncTOTP ? (
            <AddTOTP />
          ) : (
            <AddLogin />
          )}
        </div>
      </div>
    </div>
  )
}

function ItemTypeOption({
  children,
  checked,
  disabled,
  onSelect,
  value
}: {
  children: ReactNode
  checked: boolean
  disabled: boolean
  onSelect: () => void
  value: string
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        checked={checked}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        name="item-type"
        onChange={onSelect}
        type="radio"
        value={value}
      />
      <span className="flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-transparent px-4 py-2 text-sm text-muted transition peer-checked:border-primary/25 peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        {children}
      </span>
    </label>
  )
}
