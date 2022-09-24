import * as React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { PasswordVault } from '../screens/PasswordVault/PasswordVault'
import EditPassword from '../screens/PasswordVault/EditPassword'
import { AddPassword } from '../screens/PasswordVault/AddPassword'
import { PasswordsStackParamList } from './types'
import { t } from '@lingui/macro'

const Stack = createNativeStackNavigator<PasswordsStackParamList>()

function PasswordsStackNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PasswordsVault"
        options={{
          title: t`Passwords`
        }}
        component={PasswordVault}
      />
      <Stack.Screen
        options={{ title: `Add password` }}
        name="AddPassword"
        component={AddPassword}
      />
      <Stack.Screen
        name="EditPassword"
        options={{ title: `Edit password` }}
        component={EditPassword}
      />
    </Stack.Navigator>
  )
}
export default PasswordsStackNavigation
