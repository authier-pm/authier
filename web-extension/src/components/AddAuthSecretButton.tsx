import { Button } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import {
  executeScriptInCurrentTab,
  getCurrentTab
} from '@src/util/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'
import { getQrCodeFromUrl } from '../util/getQrCodeFromUrl'
import { AuthsContext } from '../providers/AuthsProvider'
import browser, { Tabs } from 'webextension-polyfill'

import { toast } from 'react-toastify'
import queryString from 'query-string'

export const AddAuthSecretButton: React.FC<{}> = () => {
  const { auths, setAuths } = useContext(AuthsContext)

  const addToAuths = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    if (!tab) {
      return
    }

    console.log('test', auths)
    const newTotpSecret = getTokenSecretFromQrCode(qr, tab)
    const existingTotpSecret = auths.find(
      ({ secret }) => newTotpSecret.secret === secret
    )
    if (existingTotpSecret) {
      toast.success(t`This TOTP secret is already in your vault`)
    } else {
      setAuths([newTotpSecret, ...auths])
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
          addToAuths(qr)
        } else {
          toast.error(
            t`could not find any QR code on this page. Make sure QR code is visible.`
          )
        }
      }}
    >
      Add new code
    </Button>
  )
}

export function getTokenSecretFromQrCode(qr: QRCode, tab: Tabs.Tab) {
  const parsedQuery = queryString.parseUrl(qr.data)

  if (!parsedQuery.query.secret) {
    console.error('QR code does not have any secret', qr.data)
    throw new Error('QR code does not have any secret')
  }
  return {
    secret: parsedQuery.query.secret as string,
    icon: tab.favIconUrl,
    label:
      (parsedQuery.query.issuer as string) ??
      decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
    originalUrl: tab.url
  }
}
