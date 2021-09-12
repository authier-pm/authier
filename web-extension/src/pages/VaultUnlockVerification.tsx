import React, { useContext, useState } from 'react'
import {
  Flex,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/react'
import { UserContext } from '@src/providers/UserProvider'

import { Formik, Form, Field, FormikHelpers } from 'formik'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import cryptoJS from 'crypto-js'
import browser from 'webextension-polyfill'

import { BackgroundContext } from '@src/providers/BackgroundProvider'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const [showPassword, setShowPassword] = useState(false)

  const { setPassword } = useContext(UserContext)
  const { loginUser } = useContext(BackgroundContext)

  return (
    <Flex flexDirection="column" width="315px">
      <Text>Re-enter you Master Password</Text>
      <Formik
        initialValues={{ password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setPassword(values.password)

          const storage = await browser.storage.local.get()

          try {
            if (
              storage.encryptedAuthsMasterPassword &&
              storage.encryptedPswMasterPassword
            ) {
              const decryptedAuths = cryptoJS.AES.decrypt(
                storage.encryptedAuthsMasterPassword,
                values.password
              ).toString(cryptoJS.enc.Utf8)

              const decryptedPsw = cryptoJS.AES.decrypt(
                storage.encryptedPswMasterPassword,
                values.password
              ).toString(cryptoJS.enc.Utf8)

              let parsedTOTP = JSON.parse(decryptedAuths)
              let parsedPsw = JSON.parse(decryptedPsw)

              console.log('parsedAuths', parsedTOTP)
              console.log('parsedPasswords', parsedPsw)
              loginUser(parsedTOTP, parsedPsw)
            }

            setSubmitting(false)
          } catch (err) {
            console.log(err)
            // Alert on wrong password
          }
        }}
      >
        {(props) => (
          <Form>
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
    </Flex>
  )
}
