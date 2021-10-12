import React, { useContext, useState } from 'react'
import {
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Center
} from '@chakra-ui/react'
import { UserContext } from '@src/providers/UserProvider'

import { Formik, Form, Field, FormikHelpers } from 'formik'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import cryptoJS from 'crypto-js'
import browser from 'webextension-polyfill'

import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { toast } from 'react-toastify'
import { t } from '@lingui/macro'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const [showPassword, setShowPassword] = useState(false)

  const { setMasterPassword, encrypt, decrypt } = useContext(UserContext)
  const { loginUser } = useContext(BackgroundContext)

  return (
    <Flex flexDirection="column" width="315px" p={4}>
      <Center>
        <LockIcon boxSize="50px" mx={20} my={3}></LockIcon>
      </Center>

      <Formik
        initialValues={{ password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setMasterPassword(values.password)

          const storage = await browser.storage.local.get()

          try {
            if (
              storage.encryptedAuthsMasterPassword &&
              storage.encryptedPswMasterPassword
            ) {
              const decryptedAuths = decrypt(
                storage.encryptedAuthsMasterPassword,
                values.password
              )

              const decryptedPsw = decrypt(
                storage.encryptedPswMasterPassword,
                values.password
              )

              let parsedTOTP = JSON.parse(decryptedAuths)
              let parsedPsw = JSON.parse(decryptedPsw)

              console.log('parsedAuths', parsedTOTP)
              console.log('parsedPasswords', parsedPsw)
              loginUser(parsedTOTP, parsedPsw)
            }

            setSubmitting(false)
          } catch (err) {
            console.log(err)

            toast.error(t`Wrong password`)
          }
        }}
      >
        {(props) => (
          <Form>
            <Field name="password">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.password && form.touched.password}
                >
                  <FormLabel htmlFor="password">
                    <Heading size="md">Re-enter you Master Password</Heading>
                  </FormLabel>
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
