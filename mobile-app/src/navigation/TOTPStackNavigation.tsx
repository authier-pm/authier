import * as React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { TOTPVault } from '../screens/TOTPVault/TOTPVault'
import { AddTOTP } from '../screens/TOTPVault/AddTOTP'
import EditTOTP from '../screens/TOTPVault/EditTOTP'
import { TOTPStackParamList } from './types'

const Stack = createNativeStackNavigator<TOTPStackParamList>()

function TOTPStackNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TOTPVault" component={TOTPVault} />
      <Stack.Screen name="AddTOTP" component={AddTOTP} />
      <Stack.Screen name="EditTOTP" component={EditTOTP} />
    </Stack.Navigator>
  )
}
export default TOTPStackNavigation
