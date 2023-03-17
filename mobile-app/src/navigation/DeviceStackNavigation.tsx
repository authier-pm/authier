import React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DeviceInfo from '../screens/Device/DeviceInfo'
import DeviceList from '../screens/Device/Devices'
import { DeviceQuery, UserQuery } from '../../shared/generated/graphqlBaseTypes'

const DeviceStack = createNativeStackNavigator<DeviceStackParamList>()

export type DeviceStackParamList = {
  DeviceList?: undefined
  DeviceInfo: {
    device: Partial<DeviceQuery>
    masterDeviceId: UserQuery['masterDeviceId']
  }
}

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
        // @ts-expect-error TODO we need to fix this TS error
        component={DeviceInfo}
      />
    </DeviceStack.Navigator>
  )
}
