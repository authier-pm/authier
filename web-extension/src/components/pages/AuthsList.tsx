import { useContext, useEffect, useState } from 'react'
import { t } from '@lingui/core/macro'
import browser from 'webextension-polyfill'
import debug from 'debug'
import { TbAuth2Fa, TbFingerprint } from 'react-icons/tb'
import { IoBanOutline, IoCopyOutline } from 'react-icons/io5'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import type {
  ILoginSecret,
  IPasskeySecret,
  ITOTPSecret
} from '@src/util/useDeviceState'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { copyTextToClipboard } from '@src/lib/clipboard'
import { cn } from '@src/lib/cn'
import { SecretItemIcon } from '../SecretItemIcon'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { PopupActionsEnum } from './PopupActionsEnum'
import { SquareMousePointer } from './SquareMousePointerIcon'
import { useRemoveWebInputMutation } from '../vault/VaultItemSettings.codegen'
import { device } from '@src/background/ExtensionDevice'
import { getWebInputsForUrl } from '@src/background/getWebInputsForUrl'
import { generateTotpTokenSync } from '@shared/totp'

const log = debug('au:AuthsList')

const cardClassName =
  'extension-surface m-1 w-full max-w-[450px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-3 shadow-lg'

const OtpCode = ({ totpSecret }: { totpSecret: ITOTPSecret }) => {
  const [addOTPEvent, { data, error }] = useAddOtpEventMutation()
  const [showWhole, setShowWhole] = useState(false)

  let otpCode = ''
  let otpCodeError: string | null = null

  const generatedOtpCode = generateTotpTokenSync({
    secret: totpSecret.totp.secret
  })

  if (generatedOtpCode === null) {
    otpCodeError = t`Failed to generate OTP code`
  } else {
    otpCode = generatedOtpCode
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

        <Tooltip
          className="left-auto right-0 translate-x-0"
          content={t`Fill TOTP into input on screen by point&click`}
        >
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

        <Tooltip
          className="left-auto right-0 translate-x-0"
          content={t`Copy password`}
        >
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

const PasskeyListItem = ({
  passkey
}: {
  passkey: Pick<IPasskeySecret['passkey'], 'label' | 'rpId' | 'userName'>
}) => {
  const label = passkey.label || passkey.rpId
  const showAccount = passkey.userName && !label.includes(passkey.userName)

  return (
    <div
      className={cn(
        cardClassName,
        'flex items-center gap-2 rounded-xl py-2 shadow-none'
      )}
      title={`${label}\n${passkey.userName}\n${passkey.rpId}`}
    >
      <TbFingerprint
        aria-hidden
        className="size-4 shrink-0 text-[color:var(--color-primary)]"
      />
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="sr-only">Passkey: </span>
        <span className="font-medium">{label}</span>
        {showAccount && (
          <span className="text-[color:var(--color-muted)]">
            {' · '}
            {passkey.userName}
          </span>
        )}
      </p>
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
  const { deviceState, currentURL, searchSecrets } =
    useContext(DeviceStateContext)
  const [removeWebInput] = useRemoveWebInputMutation()

  if (!deviceState) return null

  const matchingSecrets = searchSecrets(search).filter((secret) => {
    if (!filterByTLD || !currentURL) return true
    let url: string | null | undefined
    switch (secret.kind) {
      case EncryptedSecretType.TOTP:
        url = secret.totp.url
        if (!url) return true
        break
      case EncryptedSecretType.LOGIN_CREDENTIALS:
        url = secret.loginCredentials.url
        break
      case EncryptedSecretType.PASSKEY:
        url = `https://${secret.passkey.rpId}`
        break
    }
    if (!url) return false
    return (
      getDomainNameAndTldFromUrl(url) === getDomainNameAndTldFromUrl(currentURL)
    )
  })
  const orderedSecrets = [
    EncryptedSecretType.TOTP,
    EncryptedSecretType.LOGIN_CREDENTIALS,
    EncryptedSecretType.PASSKEY
  ].flatMap((kind) =>
    matchingSecrets
      .filter((secret) => secret.kind === kind)
      .slice(0, filterByTLD ? undefined : 20)
  )
  const hasNoSecrets = deviceState.secrets.length === 0
  const matchingWebInputsForCurrentPage = currentURL
    ? getWebInputsForUrl(currentURL)
    : []

  return (
    <div className="flex flex-col">
      {!hasNoSecrets && filterByTLD && orderedSecrets.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-[color:var(--color-muted)]">
          <span className="inline-flex items-center gap-2">
            <IoBanOutline className="size-4" />
            There are no stored secrets for current domain.
          </span>
        </div>
      ) : null}

      <div role="list" aria-label="Saved secrets">
        {orderedSecrets.map((secret) => (
          <div role="listitem" key={secret.id}>
            {secret.kind === EncryptedSecretType.TOTP && (
              <OtpCode totpSecret={secret} />
            )}
            {secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS && (
              <LoginCredentialsListItem loginSecret={secret} />
            )}
            {secret.kind === EncryptedSecretType.PASSKEY && (
              <PasskeyListItem passkey={secret.passkey} />
            )}
          </div>
        ))}
      </div>

      {hasNoSecrets ? (
        <div className="px-2 py-3 text-sm text-[color:var(--color-muted)]">
          Start by adding a password, TOTP code, or passkey
        </div>
      ) : null}

      {filterByTLD &&
      currentURL &&
      matchingWebInputsForCurrentPage.length > 0 ? (
        <div className="mt-2 px-2 pb-2">
          <Button
            className="w-full"
            variant="outline"
            onClick={async () => {
              await Promise.all(
                matchingWebInputsForCurrentPage.map(({ id }) =>
                  removeWebInput({
                    variables: {
                      id
                    }
                  })
                )
              )

              const removedIds = new Set(
                matchingWebInputsForCurrentPage.map(({ id }) => id)
              )

              const remainingWebInputs =
                device.state?.webInputs.filter((webInput) => {
                  return !removedIds.has(webInput.id)
                }) ?? []

              device.setWebInputs(remainingWebInputs)
            }}
          >
            {t`Remove saved autofill inputs for this page`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
