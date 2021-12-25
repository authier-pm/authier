import { Formik } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  View,
  Pressable,
  HStack
} from 'native-base'
import React, { useContext } from 'react'

import SInfo from 'react-native-sensitive-info'
import { UserContext } from '../providers/UserProvider'
import { saveAccessToken } from '../../util/tokenFromAsyncStorage'

interface MyFormValues {
  email: string
  password: string
}

export function Login({ navigation }) {
  const initialValues: MyFormValues = { email: 'bob@bob.com', password: 'bob' }
  // const [login, { loading }] = useLoginMutation()
  const { setIsLogged } = useContext(UserContext)

  const saveData = async (value) => {
    try {
      SInfo.setItem('encryptedSecrets', value, {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <View flex={1} p="2" w="90%" mx="auto" justifyContent="center">
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
            let concat = response.data.login.user.EncryptedSecrets?.map((i) => {
              return i.encrypted
            })

            //save secrets
            saveData(concat ? JSON.stringify(concat) : JSON.stringify([]))
            saveAccessToken(response.data.login.accessToken)

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
              <Pressable alignSelf="flex-end" mt="1">
                <Text fontSize="xs" fontWeight="500" color="indigo.500">
                  Forget Password?
                </Text>
              </Pressable>
            </FormControl>

            <Button onPress={handleSubmit} isLoading={loading}>
              Submit
            </Button>
            <HStack mt="2" justifyContent="center">
              <Text fontSize="sm" color="muted.700" fontWeight={400}>
                I'm a new user.{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text
                  color={'indigo.500'}
                  fontWeight={'medium'}
                  fontSize={'sm'}
                >
                  Sign Up
                </Text>
              </Pressable>
            </HStack>
            <Button onPress={() => navigation.navigate('QRLogin')}>
              With QR Code
            </Button>
          </VStack>
        )}
      </Formik>
    </View>
  )
}
