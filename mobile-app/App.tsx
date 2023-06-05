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
import { Alert } from 'react-native'
import { queueLink } from './src/apollo/ApolloClient'
import NetInfo from '@react-native-community/netinfo'
import messaging from '@react-native-firebase/messaging'
import * as Sentry from '@sentry/react-native'
import PolyfillCrypto from 'react-native-webview-crypto'
import CodePush from 'react-native-code-push'
import { useDeviceStore } from './src/utils/deviceStore'
import { API_URL, API_URL_RELEASE } from '@env'
import './src/sentryInit'

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
  const device = useDeviceStore((state) => state)

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
    device.initialize()
    console.log('API_URL', __DEV__ ? API_URL : API_URL_RELEASE)

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        queueLink.open()
      } else {
        queueLink.close()
      }
    })
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (__DEV__) {
        Alert.alert('FCM message arrived:', JSON.stringify(remoteMessage))
      }
    })
    return () => {
      unsubscribe()
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
