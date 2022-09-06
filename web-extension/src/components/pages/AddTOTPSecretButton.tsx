import { Button } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'

import { v4 as uuidv4 } from 'uuid'
import browser, { Tabs } from 'webextension-polyfill'

import { toast } from 'react-toastify'
import queryString from 'query-string'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

import { device } from '@src/background/ExtensionDevice'
import { getQrCodeFromUrl } from '@src/util/getQrCodeFromUrl'
import { EncryptedSecretType } from '../../../../shared/generated/graphqlBaseTypes'
import { ITOTPSecret } from '@src/util/useDeviceState'

export const AddTOTPSecretButton = () => {
  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)

  const addToTOTPs = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    if (!tab || !deviceState) {
      return
    }

    const newTotpSecret = getTokenSecretFromQrCode(qr, tab)
    const existingTotpSecret = TOTPSecrets.find(
      ({ totp }) => newTotpSecret.totp.secret === totp.secret
    )
    if (existingTotpSecret) {
      toast.success(t`This TOTP secret is already in your vault`)
    } else {
      await device.state?.addSecrets([newTotpSecret])
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
  const secret = parsedQuery.query.secret as string
  if (!secret) {
    console.error('QR code does not have any secret', qr.data)
    throw new Error('QR code does not have any secret')
  }
  return {
    id: uuidv4(),
    kind: EncryptedSecretType.TOTP,
    totp: {
      secret: secret as string,
      digits: 6,
      period: 30
    },
    encrypted: device.state!.encrypt(secret),
    iconUrl: tab.favIconUrl,
    createdAt: new Date().toJSON(),
    label:
      (parsedQuery.query.issuer as string) ??
      decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
    url: tab.url as string
  }
}
