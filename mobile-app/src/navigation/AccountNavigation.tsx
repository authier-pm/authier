import React from 'react'

import Account from '../screens/Account/Account'
import { AccountStackParamList } from './types'
import { ChangeMasterPassword } from '@src/screens/Account/ChangeMasterPassword'
import { t } from '@lingui/macro'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import SettingsNavigation from './SettingsNavigation'

const DeviceStack = createStackNavigator<AccountStackParamList>()

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
      <DeviceStack.Screen
        options={{
          ...TransitionPresets.SlideFromRightIOS
        }}
        name="Settings"
        component={SettingsNavigation}
      />
      <DeviceStack.Screen
        name="ChangeMasterPassword"
        options={{
          headerTitle: t`Change master password`
        }}
        component={ChangeMasterPassword}
      />
    </DeviceStack.Navigator>
  )
}
