import React, { useEffect } from 'react'
import { AuthNavigation } from './navigation/AuthNavigation'
import AppNavigation from './navigation/AppNavigation'

import { VaultUnlockVerification } from './screens/VaultUnlockVerification'
import { useColorMode } from 'native-base'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef
} from '@react-navigation/native'
import { Linking, Platform } from 'react-native'

import { storage } from '@utils/mmkvZustandStorage'
import { Loading } from './components/Loading'
import RNBootSplash from 'react-native-bootsplash'
import { routingInstrumentation } from './sentryInit'
import { useStore } from './utils/deviceStore'
import { useTestStore } from './utils/deviceStateStore'

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

export default function Routes() {
  const device = useStore((state) => state)
  const deviceState = useTestStore((state) => state)
  const { colorMode } = useColorMode()
  const [isReady, setIsReady] = React.useState(__DEV__ ? true : true) // this can sometimes cause issue with navigation on dev. Set to true to enable when working on navigation. Otherwise keep as true. fast refresh does a good enough job to keep you on the same screen for most cases.
  const [initialState, setInitialState] = React.useState()
  const navigation = useNavigationContainerRef()

  console.log('device', device.isInitialized, device.isLocked)
  console.log('deviceState', deviceState)
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

  useEffect(() => {}, [device.lockedState])

  if (device.isLocked) {
    return (
      <VaultUnlockVerification
        onUnlocked={() => {
          setIsReady(true)
        }}
      />
    )
  }

  if (!isReady || device.isInitialized === false) {
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
      {deviceState.authSecret ? <AppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  )
}
