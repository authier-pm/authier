/**
* This exposes the native Autofill module as a JS module. This has a
* function 'createCalendarEvent' which takes the following parameters:

* 1. String name: A string representing the name of the event
* 2. String location: A string representing the location of the event
*/
import { NativeModules } from 'react-native'
const { AutofillModule } = NativeModules

interface readableMap {
  username: string
  password: string
  androidUri: string
}
interface AutofillModule {
  sendData: (readableMap: readableMap[]) => boolean
  getData: () => Promise<string>
}

export default AutofillModule as AutofillModule
