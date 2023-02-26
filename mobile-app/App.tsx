/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Providers } from './src/Providers'
import { device } from './src/utils/Device'
import { useForceUpdate } from './useForceUpdate'
import { Alert } from 'react-native'
import CodePush from 'react-native-code-push'
import { queueLink } from './src/apollo/ApolloClient'
import NetInfo from '@react-native-community/netinfo'
import { MMKV } from 'react-native-mmkv'
import messaging from '@react-native-firebase/messaging'
import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import PolyfillCrypto from 'react-native-webview-crypto'

export const routingInstrumentation =
  new Sentry.ReactNavigationInstrumentation()

Sentry.init({
  dsn: Config.SENTRY_DSN,
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation
    })
  ]
})

let CodePushOptions = {
  checkFrequency: __DEV__
    ? CodePush.CheckFrequency.MANUAL
    : CodePush.CheckFrequency.ON_APP_RESUME,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
  updateDialog: {
    appendReleaseDescription: true,
    title: 'a new update is available!'
  }
}

export const storage = new MMKV({
  id: 'user-storage',
  encryptionKey: 'test'
})

const App = () => {
  const forceUpdate = useForceUpdate()

  async function requestUserPermission() {
    messaging().onTokenRefresh(async (fcm) => {
      console.log('ressetting token', fcm)
      return
    })
    const Token = await messaging().getToken()
    const authStatus = await messaging().requestPermission()
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL

    if (enabled) {
      console.log('Authorization status:', authStatus)
    }
  }

  useEffect(() => {
    device.emitter.on('stateChange', forceUpdate)

    requestUserPermission()

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        queueLink.open()
      } else {
        queueLink.close()
      }
    })
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage))
    })
    return () => {
      unsubscribe()
      unsubscribeNet()
      device.emitter.off('stateChange', forceUpdate)
    }
  }, [])

  console.log('test')

  return (
    <React.Fragment>
      <PolyfillCrypto />
      <Providers key={JSON.stringify(device.state)} />
    </React.Fragment>
  )
}

export default Sentry.wrap(CodePush(CodePushOptions)(App))
