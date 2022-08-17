import * as React from 'react'
import { AuthNavigation } from './navigation/AuthNavigation'
import AppNavigation from './navigation/AppNavigation'
import { DeviceContext } from './providers/DeviceProvider'
import { VaultUnlockVerification } from './screens/VaultUnlockVerification'
import { useColorMode } from 'native-base'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer
} from '@react-navigation/native'
import { Linking, Platform } from 'react-native'
import { storage } from '../App'
import { Loading } from './components/Loading'

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

export default function Routes() {
  const device = React.useContext(DeviceContext)
  const { colorMode } = useColorMode()
  const [isReady, setIsReady] = React.useState(__DEV__ ? false : true)
  const [initialState, setInitialState] = React.useState()

  React.useEffect(() => {
    console.log('lockTimeEnd', device.state?.lockTimeEnd)
    if (device.state && device.state!.lockTimeEnd <= Date.now()) {
      device.lock()
    } else if (device.state?.lockTimeEnd) {
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
