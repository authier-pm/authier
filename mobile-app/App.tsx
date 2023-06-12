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
import { queueLink } from './src/apollo/ApolloClient'
import NetInfo from '@react-native-community/netinfo'
import messaging from '@react-native-firebase/messaging'
import * as Sentry from '@sentry/react-native'
import PolyfillCrypto from 'react-native-webview-crypto'
import CodePush from 'react-native-code-push'
import { useDeviceStore } from './src/utils/deviceStore'
import './src/sentryInit'
import { API_URL } from '@env'

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

const RnApp = () => {
  const [initialize] = useDeviceStore((state) => [state.initialize])

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission()
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL

    if (enabled) {
      console.log('Authorization status:', authStatus)
    }
  }

  useEffect(() => {
    requestUserPermission()
    initialize()
    console.log('API_URL', API_URL)

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        queueLink.open()
      } else {
        queueLink.close()
      }
    })
    return () => {
      unsubscribeNet()
    }
  }, [])

  return (
    <React.Fragment>
      <PolyfillCrypto />
      <Providers />
    </React.Fragment>
  )
}

export default Sentry.wrap(CodePush(CodePushOptions)(RnApp))
