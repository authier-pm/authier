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
import { AuthsContext, UserContext } from '@src/popup/Popup'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import cryptoJS from 'crypto-js'
import { browser } from 'webextension-polyfill-ts'
import { useLocation } from 'wouter'

interface Values {
  password: string
}

export default function Verification() {
  const [location, setLocation] = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const { setAuths } = useContext(AuthsContext)
  const { setPassword, password } = useContext(UserContext)

  return (
    <Flex flexDirection="column">
      <Text>Re-enter you Master Password</Text>
      <Formik
        initialValues={{ password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setPassword(values.password)
          console.log('pass', password)
          const storage = await browser.storage.local.get()

          try {
            const decryptedAuths = cryptoJS.AES.decrypt(
              storage.encryptedAuthsMasterPassword,
              values.password
            ).toString(cryptoJS.enc.Utf8)
            let parsed = JSON.parse(decryptedAuths)

            await chrome.runtime.sendMessage({ startTimeout: true })
            await chrome.runtime.sendMessage({ close: true })
            setAuths(parsed)
            setLocation('/')
          } catch (err) {
            console.log(err)
          }

          setSubmitting(false)
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
