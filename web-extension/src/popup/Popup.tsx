import { FunctionComponent, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'

import { PopupNavBar } from '@src/components/PopupNavBar'
import { VerificationCodes } from '@src/verification-codes/VerificationCodes'
import { Home } from '../pages/Home'

import { i18n } from '@lingui/core'

import { QRCode } from '@src/pages/QRcode'

import Devices from '@src/pages/Devices'

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const [location, setLocation] = useLocation()

  useEffect(() => {
    setLocation('/')
    //browser.runtime.sendMessage({ popupMounted: true })
  }, [])

  return (
    <>
      <PopupNavBar />
      <VerificationCodes />

      <Switch location={location}>
        <Route path="/" component={Home} />
        <Route path="/secrets" component={Home} />
        <Route path="/popup.html" component={Home} />
        <Route path="/qr-code" component={QRCode} />
        <Route path="/devices" component={Devices} />
      </Switch>
    </>
  )
}
