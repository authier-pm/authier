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

  return (
    <React.Fragment>
      <Providers key={JSON.stringify(device.state)} />
    </React.Fragment>
  )
}

export default CodePush(CodePushOptions)(App)
