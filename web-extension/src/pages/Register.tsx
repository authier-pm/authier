import React, { ReactElement, useContext, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { Formik, Form, Field, FormikHelpers } from 'formik'
import { useLocation } from 'wouter'
import browser from 'webextension-polyfill'
import { setAccessToken } from '@src/util/accessTokenExtension'
import { UserContext } from '../providers/UserProvider'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { useRegisterNewUserMutation } from '../../../shared/registerNewUser.codegen'
import { device } from '@src/background/Device'
import cryptoJS from 'crypto-js'

interface Values {
  password: string
  email: string
}
export default function Register(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [register, { data, loading, error: registerError }] =
    useRegisterNewUserMutation()
  const { fireToken } = useContext(UserContext)
  const { loginUser } = useContext(BackgroundContext)
  const { refetch } = useIsLoggedInQuery()
  // console.log('~ fireToken', fireToken)

  if (registerError) {
    console.log(registerError)
  }

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg">
      <Flex alignItems="center" justifyContent="center">
        <Heading>Create account</Heading>
      </Flex>
      <Formik
        initialValues={{ email: 'bob@bob.com', password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          const deviceId = await device.getDeviceId()
          // @ts-expect-error
          const userId = crypto.randomUUID()

          let res = await register({
            variables: {
              userId,
              input: {
                email: values.email,
                ...device.getAddDeviceSecretAuthTuple(values.password, userId),
                deviceId,
                firebaseToken: fireToken,
                deviceName: device.generateDeviceName()
              }
            }
          })
          const registerResult = res.data?.registerNewUser

          if (registerResult?.accessToken) {
            // is this right, maybe someone could use proxy and send random string
            await browser.storage.local.set({
              'access-token': res.data?.registerNewUser.accessToken
            })
            setAccessToken(registerResult.accessToken as string)

            loginUser(values.password, registerResult.user.id, [])
            refetch()

            setSubmitting(false)
          }
        }}
      >
        {(props) => (
          <Form>
            <Field name="email">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.email && form.touched.email}
                  isRequired
                >
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input {...field} id="Email" placeholder="bob@bob.com" />
                  <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="password">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.password && form.touched.password}
                  isRequired
                >
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="*******"
                    />
                    <InputRightElement width="3rem">
                      <Button
                        h="1.5rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Button
              colorScheme="teal"
              variant="outline"
              type="submit"
              width="full"
              mt={4}
              isLoading={props.isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
