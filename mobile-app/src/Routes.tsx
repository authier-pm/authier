import React, { useContext } from 'react'
import { AuthScreen } from './navigation/AuthScreen'
import HomeScreen from './navigation/HomeScreen'
import { UserContext } from './providers/UserProvider'

export default function Routes() {
  const { isLogged } = useContext(UserContext)

  return isLogged ? <HomeScreen /> : <AuthScreen />
}
