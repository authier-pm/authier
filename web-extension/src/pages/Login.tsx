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
  getAccessToken,
  getUserFromToken,
  setAccessToken,
  tokenFromLocalStorage
} from '../util/accessToken'
import { Trans } from '@lingui/macro'
import { browser } from 'webextension-polyfill-ts'
import { AuthsContext } from '../providers/AuthsProvider'
import { UserContext } from '../providers/UserProvider'
import cryptoJS from 'crypto-js'
//import { AuthKey, VaultKey } from '@src/util/encrypt'

interface Values {
  password: string
  email: string
}

export default function Login(): ReactElement {
  const [location, setLocation] = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [login, { data, loading, error }] = useLoginMutation()
  const { setUserId, setPassword } = useContext(UserContext)
  const { setAuths } = useContext(AuthsContext)

  return (
    <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={6} boxShadow="lg">
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

          if (response.data) {
            await browser.storage.local.set({
              jid: response.data.login.accessToken
            })
            setAccessToken(response.data.login.accessToken)

            let id = await getUserFromToken()
            //@ts-expect-error
            setUserId(id.userId)

            if (response.data.login.auths?.encrypted && values.password) {
              console.log(response.data.login.auths?.encrypted)
              const decryptedAuths = cryptoJS.AES.decrypt(
                response.data.login.auths?.encrypted as string,
                values.password
              ).toString(cryptoJS.enc.Utf8)
              console.log('decr', decryptedAuths)
              let loaded = await JSON.parse(decryptedAuths)
              //setPassword(values.password)
              setAuths(loaded)
            }

            setLocation('/')
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

// let enc = new TextDecoder('utf-8')
// let vaultKey = await VaultKey(
//   Buffer.from(new Int16Array()),
//   values.password + values.email
// )

// const rawVaultKey = await crypto.subtle.exportKey('raw', vaultKey)
// let combined = enc.decode(rawVaultKey) + values.password

// let keyMaterial = await window.crypto.subtle.importKey(
//   'raw',
//   Buffer.from(combined),
//   'PBKDF2',
//   false,
//   ['deriveBits', 'deriveKey']
// )
// let authKey = await AuthKey(
//   Buffer.from(new Int16Array()),
//   keyMaterial
// )

// let rawAuthKey = await crypto.subtle.exportKey('raw', authKey)
