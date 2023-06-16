import * as React from 'react'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { t } from '@lingui/macro'
import { SettingsTabParamList } from './types'
import UserSettings from '@src/screens/Account/settings/UserSettings'
import DeviceSettings from '@src/screens/Account/settings/DeviceSettings'

const Tab = createMaterialTopTabNavigator<SettingsTabParamList>()

function SettingsNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {
          backgroundColor: '#2cb9b0'
        }
      }}
      initialRouteName="User"
    >
      <Tab.Screen
        name="User"
        options={{
          title: t`User`
        }}
        component={UserSettings}
      />
      <Tab.Screen
        options={{ title: t`Device` }}
        name="Device"
        component={DeviceSettings}
      />
    </Tab.Navigator>
  )
}
export default SettingsNavigation
