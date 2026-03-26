import { useContext, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { QRCode } from 'jsqr'
import queryString from 'query-string'
import { TbPhoto } from 'react-icons/tb'
import { v4 as uuidv4 } from 'uuid'
import browser, { Tabs } from 'webextension-polyfill'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { getQrCodeFromUrl } from '@src/util/getQrCodeFromUrl'
import { ITOTPSecret } from '@src/util/useDeviceState'
import { toast } from '@src/ExtensionProviders'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { EncryptedSecretType } from '../../../../shared/generated/graphqlBaseTypes'
import { constructURL } from '@shared/urlUtils'

export const AddTOTPSecretButton = () => {
  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)
  const { data } = useLimitsQuery()
  const [isLoading, setIsLoading] = useState(false)

  const addToTOTPs = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    const TOTPCount =
      device.state?.secrets.filter((s) => s.kind === EncryptedSecretType.TOTP)
        .length ?? 0
    const TOTPLimit = data?.me.TOTPlimit ?? 0

    if (TOTPCount >= TOTPLimit) {
      toast({
        title: t`You have reached your password limit. Please upgrade your account to add more passwords.`,
        status: 'error',
        isClosable: true
      })
      console.log(
        'You have reached your password limit. Please upgrade your account to add more passwords.'
      )
      return
    }

    if (!tab || !deviceState) {
      return
    }

    const newTotpSecret = await getTokenSecretFromQrCode(qr, tab)
    const existingTotpSecret = TOTPSecrets.find(
      ({ totp }) => newTotpSecret.totp.secret === totp.secret
    )

    if (existingTotpSecret) {
      toast({
        title: t`This TOTP secret is already in your vault`,
        status: 'success',
        isClosable: true
      })
      return
    }

    await device.state?.addSecrets([newTotpSecret])
    toast({
      title: t`Successfully added TOTP for ${newTotpSecret.totp.label}`,
      status: 'success',
      isClosable: true
    })
  }

  return (
    <Button
      className="justify-start"
      disabled={isLoading}
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        try {
          const src = await browser.tabs.captureVisibleTab()
          const qr = await getQrCodeFromUrl(src)

          if (qr) {
            await addToTOTPs(qr)
          } else {
            toast({
              title: t`could not find any QR code on this page. Make sure QR code is visible.`,
              status: 'error',
              isClosable: true
            })
          }
        } finally {
          setIsLoading(false)
        }
      }}
    >
      <TbPhoto className={isLoading ? 'animate-pulse' : undefined} />
      <Trans>Add QR TOTP from current page</Trans>
    </Button>
  )
}

export async function getTokenSecretFromQrCode(
  qr: QRCode,
  tab: Tabs.Tab
): Promise<ITOTPSecret> {
  const parsedQuery = queryString.parseUrl(qr.data)
  const secret = parsedQuery.query.secret as string

  if (!secret) {
    console.error('QR code does not have any secret', qr.data)
    throw new Error('QR code does not have any secret')
  }

  if (!device.state) {
    throw new Error('device not initialized')
  }

  const encrypted = await device.state.encrypt(secret)
  const hostname = constructURL(tab.url as string).hostname

  return {
    id: uuidv4(),
    kind: EncryptedSecretType.TOTP,
    totp: {
      secret: secret as string,
      digits: 6,
      period: 30,
      iconUrl: tab.favIconUrl ?? null,
      label:
        (parsedQuery.query.issuer as string) ??
        decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
      url: hostname
    },
    createdAt: new Date().toJSON(),
    encrypted
  }
}
