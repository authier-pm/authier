/**
 * @format
 */

import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging from '@react-native-firebase/messaging'
import SaveFillData from './SaveFillData'

import Buffer from 'buffer'

global.Buffer = global.Buffer || Buffer

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  let data = JSON.stringify(remoteMessage)
  await AsyncStorage.setItem('notifies', data, (e) => {
    if (e) console.log(e)
  })
})

AppRegistry.registerComponent(appName, () => App)
AppRegistry.registerHeadlessTask('SaveFillData', () => SaveFillData)
