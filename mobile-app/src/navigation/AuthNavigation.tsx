import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { Login } from '../screens/Auth/Login'
import { Register } from '../screens/Auth/Register'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigation = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false
      }}
    >
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  )
}
