import React from 'react'
import { AuthNavigation } from './navigation/AuthNavigation'
import { AppNavigation } from './navigation/AppNavigation'

import { VaultUnlockVerification } from './screens/VaultUnlockVerification'
import { useColorMode } from 'native-base'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef
} from '@react-navigation/native'

import { Loading } from './components/Loading'
import RNBootSplash from 'react-native-bootsplash'
import { routingInstrumentation } from './sentryInit'
import { useDeviceStore } from './utils/deviceStore'
import { useDeviceStateStore } from './utils/deviceStateStore'

export function Routes() {
  const [lockedState, isInitialized] = useDeviceStore((state) => [
    state.lockedState,
    state.isInitialized
  ])
  const [accessToken] = useDeviceStateStore((state) => [state.accessToken])
  const { colorMode } = useColorMode()

  const navigation = useNavigationContainerRef()

  React.useEffect(() => {
    // Do not keep native splash visible while app-level initialization is pending.
    if (isInitialized === false && !lockedState) {
      void RNBootSplash.hide({ fade: true })
    }
  }, [isInitialized, lockedState])

  if (lockedState) {
    return <VaultUnlockVerification />
  }

  if (isInitialized === false) {
    return <Loading />
  }

  return (
    <NavigationContainer
      ref={navigation}
      onReady={() => {
        void RNBootSplash.hide({ fade: true })
        routingInstrumentation.registerNavigationContainer(navigation)
      }}
      theme={colorMode === 'dark' ? DarkTheme : DefaultTheme}
    >
      {accessToken ? <AppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  )
}
