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
import { useRegisterMutation } from './Register.codegen'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import { useLocation } from 'wouter'
import { browser } from 'webextension-polyfill-ts'
import { setAccessToken } from '@src/util/accessTokenExtension'
import { UserContext } from '../providers/UserProvider'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'

interface Values {
  password: string
  email: string
}

export default function Register(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [register, { data, loading, error: registerError }] =
    useRegisterMutation()
  const { setPassword, fireToken, setUserId } = useContext(UserContext)
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
          let res = await register({
            variables: {
              email: values.email,
              password: values.password,
              firebaseToken: fireToken
            }
          })

          if (res.data?.register.accessToken) {
            // is this right, maybe someone could use proxy and send random string
            await browser.storage.local.set({
              jid: res.data?.register.accessToken
            })
            setAccessToken(res.data?.register.accessToken as string)

            setPassword(values.password)

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
