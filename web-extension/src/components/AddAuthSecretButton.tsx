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

function getNextImageSrc() {
  const storageKey = 'authier.lastIndexOfScannedImage'

  const images = document.getElementsByTagName('img')
  if (images.length === 0) {
    return
  }
  const previousIndex = sessionStorage.getItem(storageKey)
  const current =
    typeof previousIndex === 'string' && previousIndex !== null
      ? images.length - parseInt(previousIndex, 10)
      : images.length - 1

  const lastImageIndex = images.length - 1
  console.log('~ current', current)

  if (lastImageIndex < current) {
    return {
      src: images[lastImageIndex].src,
      currentImageIndex: lastImageIndex
    }
  }
  sessionStorage.setItem(storageKey, current.toString())
  return { src: images[current].src, currentImageIndex: current }
}

export const AddAuthSecretButton: React.FC<{}> = () => {
  const { auths, setAuths } = useContext(AuthsContext)

  async function tryNextImage(): Promise<null | QRCode> {
    const imageSrcAndRemaining = await executeScriptInCurrentTab(
      '(' + getNextImageSrc.toString() + ')()'
    )

    console.log(imageSrcAndRemaining)
    if (!imageSrcAndRemaining) {
      return null
    }
    const { src, currentImageIndex } = imageSrcAndRemaining

    console.log('~ currentImageIndex', currentImageIndex)

    if (src) {
      const qr = await getQrCodeFromUrl(src)

      if (qr?.data) {
        await executeScriptInCurrentTab(
          'sessionStorage.removeItem("authier.lastIndexOfScannedImage")'
        ) // reset the image index
        return qr
      }
      console.log('qr', qr)
    }

    if (currentImageIndex === 0) {
      toast.error(t`could not find any QR code on the page`)
      return null
    } else {
      return tryNextImage()
    }
  }

  const addToAuths = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    if (!tab) {
      return
    }

    console.log('test', auths)
    const twoFAItem = getTokenSecretFromQrCode(qr, tab)
    if (auths === undefined) {
      setAuths([twoFAItem])
    } else {
      setAuths([twoFAItem, ...auths])
    }

    toast({
      title: 'Successfully added',
      status: 'success',
      duration: null,
      isClosable: true
    })
  }

  return (
    <Button
      m={3}
      className="btn btn-block btn-outline-dark"
      onClick={async () => {
        const qr = await tryNextImage()

        if (qr) {
          addToAuths(qr)
        } else {
          const src = await browser.tabs.captureVisibleTab()
          const qr = await getQrCodeFromUrl(src)
          if (qr) {
            addToAuths(qr)
          }
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
