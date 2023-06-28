import React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DeviceInfo } from '../screens/Device/DeviceInfo'
import { DeviceList } from '../screens/Device/Devices'
import { DeviceStackParamList } from './types'
import { t } from '@lingui/macro'

const DeviceStack = createNativeStackNavigator<DeviceStackParamList>()

export function DeviceStackNavigation() {
  return (
    <DeviceStack.Navigator>
      <DeviceStack.Screen
        name="DeviceList"
        options={{
          title: t`Your devices`
        }}
        component={DeviceList}
      />
      <DeviceStack.Screen
        name="DeviceInfo"
        options={{
          title: t`Device`
        }}
        component={DeviceInfo}
      />
    </DeviceStack.Navigator>
  )
}
