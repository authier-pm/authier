import { useContext, useEffect, useState } from 'react'
import { t } from '@lingui/core/macro'
import browser from 'webextension-polyfill'
import debug from 'debug'
import { generateSync } from 'otplib'
import { TbAuth2Fa } from 'react-icons/tb'
import { IoBanOutline, IoCopyOutline } from 'react-icons/io5'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ILoginSecret, ISecret, ITOTPSecret } from '@src/util/useDeviceState'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { copyTextToClipboard } from '@src/lib/clipboard'
import { SecretItemIcon } from '../SecretItemIcon'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { PopupActionsEnum } from './PopupActionsEnum'
import { SquareMousePointer } from './SquareMousePointerIcon'

const log = debug('au:AuthsList')

const cardClassName =
  'extension-surface m-1 w-full max-w-[450px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-3 shadow-lg'

const OtpCode = ({ totpSecret }: { totpSecret: ITOTPSecret }) => {
  const [addOTPEvent, { data, error }] = useAddOtpEventMutation()
  const [showWhole, setShowWhole] = useState(false)

  let otpCode = ''
  let otpCodeError: string | null = null

  try {
    otpCode = generateSync({ secret: totpSecret.totp.secret })
  } catch (err) {
    otpCodeError =
      err instanceof Error ? err.message : t`Failed to generate OTP code`
  }

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col items-center gap-1">
          <SecretItemIcon {...totpSecret.totp} />
          <TbAuth2Fa className="size-7 text-[color:var(--color-primary)]" />
        </div>

        <div className="mr-auto min-w-0">
          <div className="text-sm text-[color:var(--color-muted)]">
            {totpSecret.totp.label}
          </div>

          {otpCodeError ? (
            <div className="mt-1 text-xs text-[color:var(--color-danger)]">
              {otpCodeError}
            </div>
          ) : showWhole ? (
            <button
              className="mt-1 text-left text-lg font-semibold tracking-[0.18em]"
              onClick={() => {
                setShowWhole(false)
              }}
              type="button"
            >
              {otpCode}
            </button>
          ) : (
            <Tooltip content={t`Click to show & copy`}>
              <button
                className="mt-1 inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-left text-lg font-semibold tracking-[0.18em] hover:bg-[color:var(--color-accent)]/50"
                onClick={async () => {
                  await copyTextToClipboard(otpCode)
                  setShowWhole(true)

                  const tabs = await browser.tabs.query({ active: true })
                  const url = tabs[0]?.url as string

                  await addOTPEvent({
                    variables: {
                      event: {
                        kind: 'show OTP',
                        url,
                        secretId: totpSecret.id
                      }
                    }
                  })
                  log(data, error)
                }}
                type="button"
              >
                <span>{otpCode.substring(0, 3) + '***'}</span>
                <IoCopyOutline className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>

        <Tooltip content={t`Fill TOTP into input on screen by point&click`}>
          <Button
            disabled={Boolean(otpCodeError)}
            size="icon"
            variant="primary"
            onClick={() => {
              if (otpCodeError) {
                return
              }

              browser.runtime.sendMessage({
                kind: PopupActionsEnum.TOTP_FILL_ON_CLICK,
                event: {
                  otpCode,
                  secretId: totpSecret.id
                }
              })
            }}
          >
            <SquareMousePointer />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

const LoginCredentialsListItem = ({
  loginSecret
}: {
  loginSecret: ILoginSecret
}) => {
  const { loginCredentials } = loginSecret

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <SecretItemIcon {...loginCredentials} />
        </div>

        <div className="mr-auto min-w-0 max-w-[200px]">
          <h3 className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
            {loginCredentials.label}
          </h3>
          <div className="truncate text-sm text-[color:var(--color-muted)]">
            {loginCredentials.username.replace(/http:\/\/|https:\/\//, '')}
          </div>
        </div>

        <Tooltip content={t`Copy password`}>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              void copyTextToClipboard(loginCredentials.password)
            }}
          >
            <IoCopyOutline className="size-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export const AuthsList = ({
  filterByTLD,
  search
}: {
  filterByTLD: boolean
  search: string
}) => {
  const {
    deviceState,
    TOTPSecrets,
    loginCredentials,
    currentURL,
    searchSecrets
  } = useContext(DeviceStateContext)

  if (!deviceState) {
    return null
  }

  const TOTPForCurrentDomain = TOTPSecrets.filter(({ totp }) => {
    if (!currentURL || !totp.url) {
      return true
    }

    return (
      getDomainNameAndTldFromUrl(totp.url) ===
      getDomainNameAndTldFromUrl(currentURL)
    )
  })

  const loginCredentialForCurrentDomain = loginCredentials.filter(
    ({ loginCredentials }) => {
      if (!loginCredentials.url) {
        return false
      }

      if (!currentURL) {
        return true
      }

      return (
        getDomainNameAndTldFromUrl(loginCredentials.url) ===
        getDomainNameAndTldFromUrl(currentURL)
      )
    }
  )

  const hasNoSecrets = deviceState.secrets.length === 0
  const totps = searchSecrets(search, [EncryptedSecretType.TOTP]) as ITOTPSecret[]
  const creds = searchSecrets(search, [
    EncryptedSecretType.LOGIN_CREDENTIALS
  ]) as ILoginSecret[]

  const renderedSecrets = filterByTLD
    ? [
        ...TOTPForCurrentDomain.map((auth, i) => (
          <OtpCode totpSecret={auth as ITOTPSecret} key={auth.totp.label + i} />
        )),
        ...loginCredentialForCurrentDomain.map((credentials, i) => (
          <LoginCredentialsListItem
            key={credentials.loginCredentials.label + i}
            loginSecret={credentials as ILoginSecret}
          />
        ))
      ]
    : [
        ...totps.slice(0, 20).map((auth, i) => (
          <OtpCode totpSecret={auth as ITOTPSecret} key={auth.totp.label + i} />
        )),
        ...creds.slice(0, 20).map((psw, i) => (
          <LoginCredentialsListItem
            key={psw.loginCredentials.label + i}
            loginSecret={psw as ILoginSecret}
          />
        ))
      ]

  return (
    <div className="flex flex-col">
      {!hasNoSecrets &&
      filterByTLD &&
      TOTPForCurrentDomain.length === 0 &&
      loginCredentialForCurrentDomain.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-[color:var(--color-muted)]">
          <span className="inline-flex items-center gap-2">
            <IoBanOutline className="size-4" />
            There are no stored secrets for current domain.
          </span>
        </div>
      ) : null}

      {renderedSecrets}

      {hasNoSecrets ? (
        <div className="px-2 py-3 text-sm text-[color:var(--color-muted)]">
          Start by adding a login secret or TOTP code
        </div>
      ) : null}
    </div>
  )
}
