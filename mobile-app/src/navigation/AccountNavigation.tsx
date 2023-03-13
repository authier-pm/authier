import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Account from '../screens/Account/Account'
import Settings from '../screens/Account/Settings'
import { AccountStackParamList } from './types'

const DeviceStack = createNativeStackNavigator<AccountStackParamList>()

export default function AccountNavigation() {
  return (
    <DeviceStack.Navigator>
      <DeviceStack.Screen
        options={{
          headerTitle: '',
          headerShadowVisible: false
        }}
        name="Account"
        component={Account}
      />
      <DeviceStack.Screen name="Settings" component={Settings} />
      <DeviceStack.Screen name="ChangeMasterPassword" component={Settings} />

      <DeviceStack.Screen //@ts-expect-error TODO: fix this
        name="ImportPasswords"
        component={Account}
      />
    </DeviceStack.Navigator>
  )
}
