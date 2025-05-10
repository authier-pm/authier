import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from '@react-navigation/native'
import 'react-native-reanimated'
import PolyfillCrypto from 'react-native-webview-crypto'

import { useColorScheme } from '@/hooks/useColorScheme'
import { Providers } from '../src/Providers'

import * as Sentry from '@sentry/react-native'
import { isRunningInExpoGo } from 'expo'
import { useNavigationContainerRef } from 'expo-router'
import { useEffect } from 'react'

// Construct a new integration instance. This is needed to communicate between the integration and React
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo()
})

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    // Pass integration
    navigationIntegration
  ],
  enableNativeFramesTracking: !isRunningInExpoGo() // Tracks slow and frozen frames in the application
})

function RootLayout() {
  // Capture the NavigationContainer ref and register it with the integration.
  const ref = useNavigationContainerRef()

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref)
    }
  }, [ref])
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PolyfillCrypto />
      <Providers />
    </ThemeProvider>
  )
}

// Wrap the Root Layout route component with `Sentry.wrap` to capture gesture info and profiling data.
export default Sentry.wrap(RootLayout)
