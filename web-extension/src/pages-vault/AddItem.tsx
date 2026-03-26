import { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { Trans } from '@lingui/react/macro'
import { Link as RouterLink } from 'react-router-dom'
import { AddLogin } from '@src/components/vault/addItem/AddLogin'
import { AddTOTP } from '@src/components/vault/addItem/AddTOTP'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Txt } from '@src/components/util/Txt'
import { device } from '@src/background/ExtensionDevice'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'

export const AddItem = () => {
  type SecretType = 'login' | 'totp'
  const [type, setType] = useState<SecretType>('login')
  const { loginCredentials: loginCredentialsList, TOTPSecrets } =
    useContext(DeviceStateContext)
  const { data, loading } = useLimitsQuery()

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

  const totpLimitReached = (data?.me.TOTPlimit ?? 0) <= TOTPSecrets.length
  const pswLimitReached =
    (data?.me.loginCredentialsLimit ?? 0) <= loginCredentialsList.length

  return (
    <motion.div
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
      transition={{ duration: 0.25 }}
    >
      <div className="m-auto flex w-[90%] flex-col items-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-card)] shadow-2xl sm:w-[70%] lg:w-[60%]">
        {totpLimitReached || pswLimitReached ? (
          <Txt color="yellow.600" fontSize="lg" mt={10}>
            <Trans>
              You have reached your account limit. Go to{' '}
              <RouterLink className="underline" to="/account-limits">
                Account Limits
              </RouterLink>{' '}
              to upgrade your account.
            </Trans>
          </Txt>
        ) : null}
        {device.state?.syncTOTP ? (
          <>
            <select
              className="mt-5 w-1/2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2"
              onChange={(e) => setType(e.target.value as SecretType)}
              value={type}
            >
              <option disabled={totpLimitReached} value="totp">
                TOTP
              </option>
              <option disabled={pswLimitReached} value="login">
                Login
              </option>
            </select>
            {type === 'login' ? <AddLogin /> : null}
            {type === 'totp' ? <AddTOTP /> : null}
          </>
        ) : (
          <AddLogin />
        )}
      </div>
    </motion.div>
  )
}
