import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Login } from '../screens/Login'
import { Register } from '../screens/Register'
import QRLogin from '../screens/QRLogin'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  QRLogin: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AuthScreen = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="QRLogin" component={QRLogin} />
    </Stack.Navigator>
  )
}
