/* eslint-disable @typescript-eslint/no-unused-vars */
import { NativeEventEmitter, NativeModules } from 'react-native'
import AutofillModule from './src/utils/AutofillModule'
import RNSInfo from 'react-native-sensitive-info'

module.exports = async () => {
  const eventEmitter = new NativeEventEmitter(NativeModules.AutofillModule)
  const onConnected = eventEmitter.addListener('onConnected', async (event) => {
    console.log(event)

    //Wrong dataset
    const gettingFirstData = await RNSInfo.getItem('data', {
      sharedPreferencesName: 'authierShared',
      keychainService: 'authierKCH'
    })
    console.log('initial data', JSON.parse(gettingFirstData))
    if (gettingFirstData) {
      AutofillModule.sendData(JSON.parse(gettingFirstData))
    }
  })

  const pswSaved = eventEmitter.addListener('pswSaved', async (event) => {
    console.log(event)

    const savingFirstData = await RNSInfo.setItem('data', event.pswSaved, {
      sharedPreferencesName: 'authierShared',
      keychainService: 'authierKCH'
    })
    console.log('saving', savingFirstData)
  })
}
