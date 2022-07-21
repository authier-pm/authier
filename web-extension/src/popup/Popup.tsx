import React, { FunctionComponent, useContext, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'
import browser from 'webextension-polyfill'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { i18n } from '@lingui/core'

import { QRCode } from '@src/pages/QRcode'
import { useSendAuthMessageLazyQuery } from './Popup.codegen'

import Devices from '@src/pages/Devices'
import { UserContext } from '@src/providers/UserProvider'

import { deviceDetect } from 'react-device-detect'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AboutPage } from '@src/pages/AboutPage'
import debug from 'debug'
const log = debug('au:Popup')

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const { userId } = useContext(UserContext)

  const [location, setLocation] = useLocation()
  const [sendAuthMessage] = useSendAuthMessageLazyQuery()

  const { currentURL, isFilling } = useContext(DeviceStateContext)

  useEffect(() => {
    if (isFilling) {
      log('Filling')
      const device = deviceDetect(navigator.userAgent)
      const date = new Date()

      //TODO: get all variables
      sendAuthMessage({
        variables: {
          //@ts-expect-error
          userId: userId,
          device: device.browserName + ' on ' + device.osName,
          location: 'Test',
          pageName: currentURL,
          time: date.getHours().toString() + ':' + date.getMinutes().toString()
        }
      })

      //After accept on mobile, send response and set CanFill to True
      // Listen to the response
    }
  }, [isFilling])

  useEffect(() => {
    setLocation('/')
    browser.runtime.sendMessage({ popupMounted: true })
  }, [])

  return (
    <>
      <NavBar />

      <Switch location={location}>
        <Route path="/" component={Home} />
        <Route path="/secrets" component={Home} />
        <Route path="/popup.html" component={Home} />
        <Route path="/qr-code" component={QRCode} />
        <Route path="/devices" component={Devices} />
        <Route path="/about" component={AboutPage} />
      </Switch>
    </>
  )
}
