import React from 'react'

import { Account } from '../screens/Account/Account'
import { AccountStackParamList } from './types'
import { ChangeMasterPassword } from '@src/screens/Account/ChangeMasterPassword'
import { t } from '@lingui/macro'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import { SettingsNavigation } from './SettingsNavigation'
import { Limits } from '@src/screens/Account/Limits'

const DeviceStack = createStackNavigator<AccountStackParamList>()

export function AccountNavigation() {
  return (
    <DeviceStack.Navigator initialRouteName="Account">
      <DeviceStack.Screen
        options={{
          headerShadowVisible: false,
          headerTitle: t`Account`
        }}
        name={'Account'}
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
      <DeviceStack.Screen
        name="Limits"
        options={{
          headerTitle: t`Limits`
        }}
        component={Limits}
      />
    </DeviceStack.Navigator>
  )
}
