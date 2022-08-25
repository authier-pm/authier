import React, { useContext, useEffect } from 'react'
import { AuthNavigation } from './navigation/AuthNavigation'
import AppNavigation from './navigation/AppNavigation'
import { DeviceContext } from './providers/DeviceProvider'
import { VaultUnlockVerification } from './screens/VaultUnlockVerification'
import { useColorMode } from 'native-base'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef
} from '@react-navigation/native'
import { Linking, Platform } from 'react-native'
import { routingInstrumentation, storage } from '../App'
import { Loading } from './components/Loading'
import RNBootSplash from 'react-native-bootsplash'

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

export default function Routes() {
  const device = useContext(DeviceContext)
  const { colorMode } = useColorMode()
  const [isReady, setIsReady] = React.useState(false ? false : true)
  const [initialState, setInitialState] = React.useState()
  const navigation = useNavigationContainerRef()

  useEffect(() => {
    if (device.state && device.state!.lockTimeEnd <= Date.now()) {
      device.lock()
    } else if (device.state?.lockTimeEnd) {
      console.log('lockTimeEnd', device.state?.lockTimeEnd)
      device.startVaultLockTimer()
    }
  }, [])

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL()

        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = storage.getString(PERSISTENCE_KEY)
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined

          if (state !== undefined) {
            setInitialState(state)
          }
        }
      } finally {
        setIsReady(true)
      }
    }

    if (!isReady) {
      restoreState()
    }
  }, [isReady])

  if (device.lockedState) {
    return <VaultUnlockVerification />
  }

  if (!isReady) {
    return <Loading />
  }

  return (
    <NavigationContainer
      ref={navigation}
      onReady={() => {
        RNBootSplash.hide({ fade: true })
        routingInstrumentation.registerNavigationContainer(navigation)
      }}
      initialState={initialState}
      onStateChange={(state) =>
        storage.set(PERSISTENCE_KEY, JSON.stringify(state))
      }
      theme={colorMode === 'dark' ? DarkTheme : DefaultTheme}
    >
      {device.state ? <AppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  )
}
