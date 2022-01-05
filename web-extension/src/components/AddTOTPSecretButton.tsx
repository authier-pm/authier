import { Button } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'
import { getQrCodeFromUrl } from '../util/getQrCodeFromUrl'

import browser, { Tabs } from 'webextension-polyfill'

import { toast } from 'react-toastify'
import queryString from 'query-string'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ITOTPSecret } from '@src/util/useDeviceState'
import { EncryptedSecretsType } from '@src/generated/graphqlBaseTypes'
import { device } from '@src/background/ExtensionDevice'

export const AddTOTPSecretButton: React.FC<{}> = () => {
  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)

  const addToTOTPs = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    if (!tab || !deviceState) {
      return
    }

    const newTotpSecret = getTokenSecretFromQrCode(qr, tab)
    const existingTotpSecret = TOTPSecrets.find(
      ({ totp }) => newTotpSecret.totp === totp
    )
    if (existingTotpSecret) {
      toast.success(t`This TOTP secret is already in your vault`)
    } else {
      await device.state?.addSecret(newTotpSecret)
      toast.success(t`Successfully added TOTP for ${newTotpSecret.label}`)
    }
  }

  return (
    <Button
      className="btn btn-block btn-outline-dark"
      onClick={async () => {
        const src = await browser.tabs.captureVisibleTab()
        const qr = await getQrCodeFromUrl(src)
        if (qr) {
          addToTOTPs(qr)
        } else {
          toast.error(
            t`could not find any QR code on this page. Make sure QR code is visible.`
          )
        }
      }}
    >
      <Trans>Add QR TOTP</Trans>
    </Button>
  )
}

export function getTokenSecretFromQrCode(
  qr: QRCode,
  tab: Tabs.Tab
): Omit<ITOTPSecret, 'id'> {
  const parsedQuery = queryString.parseUrl(qr.data)
  const secret = parsedQuery.query.secret as string
  if (!secret) {
    console.error('QR code does not have any secret', qr.data)
    throw new Error('QR code does not have any secret')
  }
  return {
    kind: EncryptedSecretsType.TOTP as any,
    totp: secret as string,
    encrypted: device.state!.encrypt(secret),
    iconUrl: tab.favIconUrl,
    label:
      (parsedQuery.query.issuer as string) ??
      decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
    url: tab.url as string
  }
}
