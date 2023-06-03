import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Account from '../screens/Account/Account'
import Settings from '../screens/Account/Settings'
import { AccountStackParamList } from './types'
import { ChangeMasterPassword } from '@src/screens/Account/ChangeMasterPassword'
import { t } from '@lingui/macro'

const DeviceStack = createNativeStackNavigator<AccountStackParamList>()

export default function AccountNavigation() {
  return (
    <DeviceStack.Navigator>
      <DeviceStack.Screen
        options={{
          headerShadowVisible: false
        }}
        name={t`Account` as 'Account'}
        component={Account}
      />
      <DeviceStack.Screen name="Settings" component={Settings} />
      <DeviceStack.Screen
        name="ChangeMasterPassword"
        options={{
          headerTitle: t`Change master password`
        }}
        component={ChangeMasterPassword}
      />

      <DeviceStack.Screen //@ts-expect-error TODO: fix this
        name="ImportPasswords"
        component={Account}
      />
    </DeviceStack.Navigator>
  )
}
