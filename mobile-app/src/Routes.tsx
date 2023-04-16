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

import { storage } from './storage'
import { Loading } from './components/Loading'
import RNBootSplash from 'react-native-bootsplash'
import { routingInstrumentation } from './sentryInit'

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

export default function Routes() {
  const device = useContext(DeviceContext)
  const { colorMode } = useColorMode()
  const [isReady, setIsReady] = React.useState(__DEV__ ? false : true) // this can sometimes cause issue with navigation on dev. Set to false to disable to verify if it's the cause or not.
  const [initialState, setInitialState] = React.useState()
  const navigation = useNavigationContainerRef()

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

  if (device.lockedState) {
    return (
      <VaultUnlockVerification
        onUnlocked={() => {
          setIsReady(true)
        }}
      />
    )
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
