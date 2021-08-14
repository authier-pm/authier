import { Box } from '@chakra-ui/layout'
import React, { ReactElement, useContext, useEffect } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import Login from './pages/Login'
import Register from './pages/Register'
import Verification from './pages/Verification'
import { UserContext } from './providers/UserProvider'
import { useBackground } from './util/useBackground'

function AuthPages(): ReactElement {
  const [location, setLocation] = useLocation()
  const { verify } = useContext(UserContext)
  const { safeLocked } = useBackground()

  return (
    <>
      <Box width="315px">
        <Switch>
          <Route path="/popup.html" component={Login} />
          <Route path="/register" component={Register} />
        </Switch>
      </Box>
    </>
  )
}

export default AuthPages
