import { Formik, FormikHelpers } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  View,
  Pressable,
  HStack,
  Spinner,
  Icon,
  Center
} from 'native-base'
import React, { Dispatch, SetStateAction, useContext, useState } from 'react'

import { LoginAwaitingApproval } from './LoginAwaitingApproval'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Trans } from '@lingui/macro'
import { DeviceContext } from '../../providers/DeviceProvider'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthNavigation'

interface LoginFormValues {
  email: string
  password: string
}

type NavigationProps = NativeStackScreenProps<AuthStackParamList, 'Login'>

export const LoginContext = React.createContext<{
  formState: LoginFormValues
  setFormState: Dispatch<SetStateAction<LoginFormValues | null>>
}>({} as any)

export function Login({ navigation }: NavigationProps) {
  const initialValues: LoginFormValues = {
    email: 'bob@bob.com',
    password: 'bob'
  }
  const [show, setShow] = React.useState(false)
  const [formState, setFormState] = useState<LoginFormValues | null>(null)
  let device = useContext(DeviceContext)

  if (!device.fireToken) {
    return (
      <Center>
        <Spinner />
      </Center>
    )
  }

  if (formState) {
    return (
      <LoginContext.Provider value={{ formState, setFormState }}>
        <LoginAwaitingApproval />
      </LoginContext.Provider>
    )
  }

  return (
    <View p="8" justifyContent="center">
      <Heading fontWeight="600">
        <Trans>Welcome</Trans>
      </Heading>
      <Heading mt="1" fontWeight="medium" size="xs">
        <Trans>Log in to continue!</Trans>
      </Heading>

      <Formik
        initialValues={initialValues}
        onSubmit={async (
          values: LoginFormValues,
          { setSubmitting }: FormikHelpers<LoginFormValues>
        ) => {
          setFormState(values)
          setSubmitting(false)
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          isSubmitting,
          errors
        }) => (
          <VStack space={3} mt="5">
            <FormControl>
              <FormControl.Label
                _text={{
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Email
              </FormControl.Label>
              <Input
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />

              <FormControl.ErrorMessage>
                {errors.email}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl>
              <FormControl.Label
                _text={{
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Password
              </FormControl.Label>
              <Input
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                type={show ? 'text' : 'password'}
                InputRightElement={
                  <Icon
                    as={
                      <Ionicons
                        name={show ? 'eye-outline' : 'eye-off-outline'}
                      />
                    }
                    size={5}
                    mr="2"
                    color="muted.400"
                    onPress={() => setShow(!show)}
                  />
                }
                placeholder="Password"
              />

              <FormControl.ErrorMessage>
                {errors.password}
              </FormControl.ErrorMessage>
            </FormControl>

            <Button onPress={handleSubmit} isLoading={isSubmitting}>
              <Trans>Submit</Trans>
            </Button>
            <HStack mt="2" justifyContent="center" space={1}>
              <Text fontSize="sm" color="muted.500" fontWeight={400}>
                <Trans>I'm a new user.</Trans>
              </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text
                  color={'indigo.500'}
                  fontWeight={'medium'}
                  fontSize={'sm'}
                >
                  <Trans>Sign Up</Trans>
                </Text>
              </Pressable>
            </HStack>
            {/* <Button onPress={() => navigation.navigate('QRLogin')}>
              With QR Code
            </Button> */}
          </VStack>
        )}
      </Formik>
    </View>
  )
}
