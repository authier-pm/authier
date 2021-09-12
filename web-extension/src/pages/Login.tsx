import React, { ReactElement, useContext, useState } from 'react'
import {
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Box,
  Text,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading
} from '@chakra-ui/react'
import { useLoginMutation } from './Login.codegen'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import { Link, useLocation } from 'wouter'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  getUserFromToken,
  setAccessToken,
  getTokenFromLocalStorage
} from '../util/accessTokenExtension'
import { t, Trans } from '@lingui/macro'
import browser from 'webextension-polyfill'
import { AuthsContext } from '../providers/AuthsProvider'
import { UserContext } from '../providers/UserProvider'
import cryptoJS from 'crypto-js'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { toast } from 'react-toastify'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
//import { AuthKey, VaultKey } from '@src/util/encrypt'

interface Values {
  password: string
  email: string
}

export default function Login(): ReactElement {
  const { refetch } = useIsLoggedInQuery()
  const [location, setLocation] = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [login, { data, loading, error }] = useLoginMutation()
  const { setUserId } = useContext(UserContext)
  const { setAuths } = useContext(AuthsContext)
  const { savePasswordsToBg } = useContext(BackgroundContext)

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg">
      <Flex alignItems="center" justifyContent="center">
        <Heading>Login</Heading>
      </Flex>

      <Formik
        initialValues={{ email: 'bob@bob.com', password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          const response = await login({
            variables: { email: values.email, password: values.password }
          })

          if (response.data?.login?.accessToken) {
            await browser.storage.local.set({
              'access-token': response.data.login?.accessToken
            })
            setAccessToken(response.data.login?.accessToken)

            let decodedToken = await getUserFromToken()
            console.log('~ decodedToken', decodedToken)

            setUserId(decodedToken.userId)
            let decryptedAuths = ''
            let decryptedPasswords = ''
            console.log('res', response)
            //@ts-expect-error
            if (response.data.login.secrets[0] && values.password) {
              response.data.login?.secrets?.forEach((i) => {
                if (i.kind === 'TOTP') {
                  decryptedAuths = cryptoJS.AES.decrypt(
                    i.encrypted as string,
                    values.password
                  ).toString(cryptoJS.enc.Utf8)
                } else if ('LOGIN_CREDENTIALS') {
                  decryptedPasswords = cryptoJS.AES.decrypt(
                    i.encrypted as string,
                    values.password
                  ).toString(cryptoJS.enc.Utf8)
                  console.log(decryptedPasswords)
                }
              })

              if (decryptedAuths) {
                let loadedAuths = await JSON.parse(decryptedAuths)
                setAuths(loadedAuths)
              }

              if (decryptedPasswords) {
                let loadCredentials = await JSON.parse(decryptedPasswords)
                savePasswordsToBg(loadCredentials)
              }
              console.log('decrSecrets', decryptedAuths)
              console.log('decrSecrets', decryptedPasswords)
            }
            refetch()
          } else {
            toast.error(t`Login failed, check your password`)
          }

          setSubmitting(false)
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
              Login
            </Button>
          </Form>
        )}
      </Formik>
      <Link to="/register">
        <Text>
          <Trans>Don't have account?</Trans>
        </Text>
      </Link>
    </Box>
  )
}
