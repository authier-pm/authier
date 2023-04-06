import React, { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ILoginFormValues, Login, LoginContext } from '../screens/Auth/Login'
import { Register } from '../screens/Auth/Register'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  QRLogin: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigation = () => {
  const [formState, setFormState] = useState<ILoginFormValues>({
    email: '',
    password: '',
    submitted: false
  })

  return (
    <LoginContext.Provider value={{ formState, setFormState }}>
      <AuthStack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <AuthStack.Screen name="Login" component={Login} />
        <AuthStack.Screen name="Register" component={Register} />
      </AuthStack.Navigator>
    </LoginContext.Provider>
  )
}
