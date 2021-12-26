/* eslint-disable @typescript-eslint/no-unused-vars */
import { NativeEventEmitter, NativeModules } from 'react-native'
import AutofillModule from './util/AutofillModule'
import RNSInfo from 'react-native-sensitive-info'

module.exports = async () => {
  const eventEmitter = new NativeEventEmitter(NativeModules.AutofillModule)
  const onConnected = eventEmitter.addListener('onConnected', async (event) => {
    console.log(event)

    const gettingFirstData = await RNSInfo.getItem('data', {
      sharedPreferencesName: 'mySharedPrefs',
      keychainService: 'myKeychain'
    })
    console.log('initial data', JSON.parse(gettingFirstData))
    if (gettingFirstData) {
      AutofillModule.sendData(JSON.parse(gettingFirstData))
    }
  })

  const pswSaved = eventEmitter.addListener('pswSaved', async (event) => {
    console.log(event)

    const savingFirstData = await RNSInfo.setItem('data', event.pswSaved, {
      sharedPreferencesName: 'mySharedPrefs',
      keychainService: 'myKeychain'
    })
    console.log('saving', savingFirstData)
  })
}
