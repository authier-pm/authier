import { Button, useToast } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import {
  executeScriptInCurrentTab,
  getCurrentTab
} from '@src/executeScriptInCurrentTab'
import React, { useContext } from 'react'
import { QRCode } from 'jsqr'
import { getQrCodeFromUrl } from '../util/getQrCodeFromUrl'
import { AuthsContext } from '../popup/Popup'
import { browser } from 'webextension-polyfill-ts'

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
  const toast = useToast()
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
      toast({
        title: t`could not find any QR code on the page`,
        status: 'error'
      })
      return null
    } else {
      return tryNextImage()
    }
  }

  const addToAuths = async (qr: QRCode) => {
    const tab = await getCurrentTab()

    const qrDataParts = qr.data.split('?secret=')
    if (!tab) {
      return
    }
    setAuths([
      {
        secret: qrDataParts[1],
        icon: tab.favIconUrl,
        label: decodeURIComponent(
          qrDataParts[0].replace('otpauth://totp/', '')
        ),
        originalUrl: tab.url
      },
      ...auths
    ])

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
