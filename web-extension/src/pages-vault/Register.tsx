import React, { ReactElement, useState } from 'react'
import {
  Box,
  Button,
  chakra,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import browser from 'webextension-polyfill'
import { setAccessToken } from '@src/util/accessTokenExtension'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import { Trans } from '@lingui/macro'
import type { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { generateEncryptionKey } from '@src/util/generateEncryptionKey'
import { useRegisterNewUserMutation } from './registerNewUser.codegen'
import { Link } from 'react-router-dom'

declare global {
  interface Crypto {
    randomUUID: () => string
  }
}

interface Values {
  password: string
  email: string
}
export default function Register(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [register, { data, loading, error: registerError }] =
    useRegisterNewUserMutation()

  // console.log('~ fireToken', fireToken)
  const { fireToken } = device
  if (!fireToken) {
    return <Spinner />
  }

  if (registerError) {
    console.log(registerError)
  }

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg" minW="400px">
      <Flex alignItems="center" justifyContent="center">
        <Heading>Create account</Heading>
      </Flex>
      <Formik
        initialValues={{ email: '', password: '' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          const deviceId = await device.getDeviceId()

          const userId = crypto.randomUUID()

          const encryptionSalt = device.generateBackendSecret()

          const masterEncryptionKey = generateEncryptionKey(
            values.password,
            encryptionSalt
          )
          console.log('~ masterEncryptionKey', masterEncryptionKey)

          const params = device.initLocalDeviceAuthSecret(
            masterEncryptionKey,
            userId
          )
          console.log('~ params', params)
          const res = await register({
            variables: {
              userId,
              input: {
                encryptionSalt,
                email: values.email,
                ...params,
                deviceId,
                deviceName: device.generateDeviceName(),
                firebaseToken: fireToken
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

            const deviceState: IBackgroundStateSerializable = {
              masterEncryptionKey: masterEncryptionKey,
              userId: userId,
              secrets: [],
              email: values.email,
              deviceName: device.name,
              encryptionSalt,
              authSecret: params.addDeviceSecret,
              authSecretEncrypted: params.addDeviceSecretEncrypted
            }

            device.save(deviceState)
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
            <chakra.p
              p={2}
              fontSize="xs"
              textAlign="center"
              color="gray.600"
              backgroundColor="whiteAlpha.500"
            >
              By signing up you agree to our{' '}
              <chakra.a color="brand.500">Terms of Service</chakra.a>
            </chakra.p>
          </Form>
        )}
      </Formik>
      <Link to="/">
        <Text pt={3}>
          <Trans>Already have an account?</Trans>
        </Text>
      </Link>
    </Box>
  )
}
