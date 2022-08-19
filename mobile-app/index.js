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

AppRegistry.registerComponent(appName, () => App)
AppRegistry.registerHeadlessTask('SaveFillData', () => SaveFillData)
