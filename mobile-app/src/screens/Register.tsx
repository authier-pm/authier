import { Formik } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  View,
  Pressable,
  Text
} from 'native-base'
import React, { useContext } from 'react'
import { saveAccessToken } from '../../util/tokenFromAsyncStorage'
import { UserContext } from '../providers/UserProvider'
import { useRegisterMutation } from '../../../shared/Register.codegen'

interface MyFormValues {
  email: string
  password: string
}

export function Register({ navigation }) {
  const initialValues: MyFormValues = { email: 'bob@bob.com', password: 'bob' }
  const [register, { loading }] = useRegisterMutation()
  const { setIsLogged, token } = useContext(UserContext)

  return (
    <View safeArea flex={1} p="2" w="90%" mx="auto" justifyContent="center">
      <Heading size="lg" fontWeight="600" color="coolGray.800">
        Welcome
      </Heading>
      <Heading mt="1" color="coolGray.600" fontWeight="medium" size="xs">
        Log in to continue!
      </Heading>

      <Formik
        initialValues={initialValues}
        onSubmit={async (values, actions) => {
          const response = await register({
            variables: {
              email: values.email,
              password: values.password,
              firebaseToken: token as string,
              deviceName: 'Mobile' // TODO get device name from react native
            }
          })

          if (response.data?.register.accessToken) {
            //save accessToken
            saveAccessToken(response.data?.register.accessToken)

            // //is logged
            setIsLogged(true)

            actions.setSubmitting(false)
          } else {
            console.error(`Login failed, check your password`)
          }
          actions.setSubmitting(false)
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <VStack space={3} mt="5">
            <FormControl>
              <FormControl.Label
                _text={{
                  color: 'coolGray.800',
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
            </FormControl>

            <FormControl>
              <FormControl.Label
                _text={{
                  color: 'coolGray.800',
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
                type="password"
              />
            </FormControl>

            <Button onPress={handleSubmit} isLoading={loading}>
              Register
            </Button>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text color={'indigo.500'} fontWeight={'medium'} fontSize={'sm'}>
                Sign Up
              </Text>
            </Pressable>
          </VStack>
        )}
      </Formik>
    </View>
  )
}
