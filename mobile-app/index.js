/**
 * @format
 */
import 'react-native-gesture-handler'
import 'intl'
import 'intl/locale-data/jsonp/en' // or any other locale you need
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import SaveFillData from './SaveFillData'
// messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//   let data = JSON.stringify(remoteMessage)
//   await AsyncStorage.setItem('notifies', data, (e) => {
//     if (e) console.log(e)
//   })
// })

AppRegistry.registerComponent(appName, () => App)
AppRegistry.registerHeadlessTask('SaveFillData', () => SaveFillData)
