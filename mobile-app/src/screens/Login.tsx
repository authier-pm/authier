import { Formik } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  View,
  Pressable
} from 'native-base'
import React from 'react'
import { useLoginMutation } from './Login.codegen'

interface MyFormValues {
  email: string
  password: string
}

export function Login({ navigation }) {
  const initialValues: MyFormValues = { email: 'bob@bob.com', password: 'bob' }
  const [login] = useLoginMutation()
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
          const response = await login({
            variables: { email: values.email, password: values.password }
          })

          if (response.data?.login?.accessToken) {
            console.log('data', response)
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
              <Pressable alignSelf="flex-end" mt="1">
                <Text fontSize="xs" fontWeight="500" color="indigo.500">
                  Forget Password?
                </Text>
              </Pressable>
            </FormControl>

            <Button onPress={handleSubmit}>Submit</Button>
          </VStack>
        )}
      </Formik>
      {/* <Button onPress={() => navigation.navigate('Register')}>Register</Button> */}
    </View>
  )
}
