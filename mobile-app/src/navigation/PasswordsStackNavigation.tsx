import * as React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { PasswordVault } from '../screens/PasswordVault/PasswordVault'
import EditPassword from '../screens/PasswordVault/EditPassword'
import { AddPassword } from '../screens/PasswordVault/AddPassword'
import { PasswordsStackParamList } from './types'

const Stack = createNativeStackNavigator<PasswordsStackParamList>()

function PasswordsStackNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PasswordsVault"
        options={{
          title: 'Passwords Vault'
        }}
        component={PasswordVault}
      />
      <Stack.Screen name="AddPassword" component={AddPassword} />
      <Stack.Screen name="EditPassword" component={EditPassword} />
    </Stack.Navigator>
  )
}
export default PasswordsStackNavigation