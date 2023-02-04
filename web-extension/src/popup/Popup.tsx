import React, { FunctionComponent, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'
import browser from 'webextension-polyfill'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { i18n } from '@lingui/core'

import { QRCode } from '@src/pages/QRcode'

import Devices from '@src/pages/Devices'

import { AboutPage } from '@src/pages/AboutPage'
import debug from 'debug'
const log = debug('au:Popup')

i18n.activate('en')
console.log('aaaa')
export const Popup: FunctionComponent = () => {
  const [location, setLocation] = useLocation()

  useEffect(() => {
    setLocation('/')
    //browser.runtime.sendMessage({ popupMounted: true })
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
