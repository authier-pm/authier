import * as React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { TOTPVault } from '../screens/TOTPVault/TOTPVault'
import { AddTOTP } from '../screens/TOTPVault/AddTOTP'
import { EditTOTP } from '../screens/TOTPVault/EditTOTP'
import { TOTPStackParamList } from './types'
import { t } from '@lingui/core/macro'
import { QRScan } from '@src/screens/TOTPVault/QRScan'

const Stack = createNativeStackNavigator<TOTPStackParamList>()

export function TOTPStackNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TOTPVault"
        options={{ title: t`TOTPs` }}
        component={TOTPVault}
      />
      <Stack.Screen
        name="AddTOTP"
        options={{ title: t`Add TOTP` }}
        component={AddTOTP}
      />
      <Stack.Screen
        name="EditTOTP"
        options={{ title: t`Edit TOTP` }}
        component={EditTOTP}
      />

      <Stack.Screen
        name="QRScan"
        options={{ title: t`Scan QR` }}
        component={QRScan}
      />
    </Stack.Navigator>
  )
}
