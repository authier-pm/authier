import React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DeviceInfo from '../screens/Device/DeviceInfo'
import DeviceList from '../screens/Device/Devices'
import { DeviceStackParamList } from './types'

const DeviceStack = createNativeStackNavigator<DeviceStackParamList>()

export default function DeviceStackNavigation() {
  return (
    <DeviceStack.Navigator>
      <DeviceStack.Screen
        name="DeviceList"
        options={{
          title: 'Your devices'
        }}
        component={DeviceList}
      />
      <DeviceStack.Screen
        name="DeviceInfo"
        options={{
          title: 'Device'
        }}
        component={DeviceInfo}
      />
    </DeviceStack.Navigator>
  )
}
