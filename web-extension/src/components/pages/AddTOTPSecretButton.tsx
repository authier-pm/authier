import { Button } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { getCurrentTab } from '../../util/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'

import { v4 as uuidv4 } from 'uuid'
import browser, { Tabs } from 'webextension-polyfill'

import { toast } from 'react-toastify'
import queryString from 'query-string'
import { DeviceStateContext } from '../../providers/DeviceStateProvider'

import { device } from '../../background/ExtensionDevice'
import { getQrCodeFromUrl } from '../../util/getQrCodeFromUrl'
import { EncryptedSecretType } from '../../../../shared/generated/graphqlBaseTypes'
import { ITOTPSecret } from '../../util/useDeviceState'
import { useMeExtensionQuery } from '../../pages-vault/AccountLimits.codegen'

export const AddTOTPSecretButton = () => {
  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)
  const { data } = useMeExtensionQuery()

  const addToTOTPs = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    const TOTPCount =
      device.state?.secrets.filter((s) => s.kind === EncryptedSecretType.TOTP)
        .length ?? 0
    const TOTPLimit = data?.me?.TOTPlimit ?? 0

    console.log('TOTPCount', TOTPCount, 'TOTPLimit', TOTPLimit)

    if (TOTPCount >= TOTPLimit) {
      toast.error(
        t`You have reached your password limit. Please upgrade your account to add more passwords.`
      )
      console.log(
        'You have reached your password limit. Please upgrade your account to add more passwords.'
      )
      return
    }

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
      toast.success(t`Successfully added TOTP for ${newTotpSecret.totp.label}`)
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
      period: 30,
      iconUrl: tab.favIconUrl ?? null,

      label:
        (parsedQuery.query.issuer as string) ??
        decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
      url: tab.url as string
    },
    createdAt: new Date().toJSON(),
    encrypted: device.state!.encrypt(secret)
  }
}
