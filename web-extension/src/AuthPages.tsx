import { Box } from '@chakra-ui/layout'
import React, { ReactElement, useContext } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import Login from './pages/Login'
import { QRCode } from './pages/QRcode'
import Register from './pages/Register'

function AuthPages(): ReactElement {
  return (
    <>
      <Box width="315px">
        <Switch>
          <Route path="/" component={Login} />
          <Route path="/popup.html" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/qr-code" component={QRCode} />
        </Switch>
      </Box>
    </>
  )
}

export default AuthPages
