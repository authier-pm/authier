import { Button } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import {
  executeScriptInCurrentTab,
  getCurrentTab
} from '@src/util/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'
import { getQrCodeFromUrl } from '../util/getQrCodeFromUrl'

import browser, { Tabs } from 'webextension-polyfill'

import { toast } from 'react-toastify'
import queryString from 'query-string'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { ITOTPSecret } from '@src/util/useBackgroundState'
import { EncryptedSecretsType } from '@src/generated/graphqlBaseTypes'

export const AddTOTPSecretButton: React.FC<{}> = () => {
  const { backgroundState, forceUpdate } = useContext(BackgroundContext)

  const addToTOTPs = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    if (!tab || !backgroundState) {
      return
    }

    const newTotpSecret = getTokenSecretFromQrCode(qr, tab)
    const existingTotpSecret = backgroundState.totpSecrets.find(
      ({ totp }) => newTotpSecret.totp === totp
    )
    if (existingTotpSecret) {
      toast.success(t`This TOTP secret is already in your vault`)
    } else {
      await browser.runtime.sendMessage({
        action: BackgroundMessageType.addTOTPSecret,
        payload: newTotpSecret
      })
      forceUpdate()
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
): ITOTPSecret {
  const parsedQuery = queryString.parseUrl(qr.data)

  if (!parsedQuery.query.secret) {
    console.error('QR code does not have any secret', qr.data)
    throw new Error('QR code does not have any secret')
  }
  return {
    kind: EncryptedSecretsType.TOTP as any,
    totp: parsedQuery.query.secret as string,
    iconUrl: tab.favIconUrl,
    label:
      (parsedQuery.query.issuer as string) ??
      decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
    url: tab.url as string
  }
}
