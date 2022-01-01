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
import { Formik, Form, Field, FormikHelpers } from 'formik'
import { Link, useLocation } from 'wouter'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import debug from 'debug'

const log = debug('backgroundPage')

import {
  getUserFromToken,
  setAccessToken,
  getTokenFromLocalStorage
} from '../util/accessTokenExtension'
import { t, Trans } from '@lingui/macro'

import { UserContext } from '../providers/UserProvider'
import cryptoJS from 'crypto-js'

import { toast } from 'react-toastify'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import browser from 'webextension-polyfill'

import { device } from '@src/background/Device'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from './Login.codegen'
import { ISecret } from '@src/util/useBackgroundState'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
//import { AuthKey, VaultKey } from '@src/util/encrypt'

interface Values {
  password: string
  email: string
}

export default function Login(): ReactElement {
  const [location, setLocation] = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [addNewDevice] = useAddNewDeviceForUserMutation()
  const [deviceDecryptionChallenge, { loading }] =
    useDeviceDecryptionChallengeMutation()
  const { setUserId, fireToken } = useContext(UserContext)
  const { deviceLogin, decrypt } = useContext(BackgroundContext)

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
          const decryptionChallenge = await deviceDecryptionChallenge({
            variables: {
              email: values.email
            }
          })

          const addDeviceSecretEncrypted =
            decryptionChallenge.data?.deviceDecryptionChallenge
              ?.addDeviceSecretEncrypted

          const userId =
            decryptionChallenge.data?.deviceDecryptionChallenge?.user.id

          if (!addDeviceSecretEncrypted || !userId) {
            toast.error(t`Login failed, check your username`)
            return
          }

          const currentSecret = cryptoJS.AES.decrypt(
            addDeviceSecretEncrypted,
            values.password,
            {
              iv: cryptoJS.enc.Utf8.parse(userId)
            }
          ).toString(cryptoJS.enc.Utf8)

          const response = await addNewDevice({
            variables: {
              input: {
                deviceId: await device.getDeviceId(),
                ...device.getAddDeviceSecretAuthTuple(values.password, userId),
                email: values.email,
                deviceName: device.generateDeviceName(),
                firebaseToken: fireToken
              },
              currentAddDeviceSecret: currentSecret
            }
          })

          if (response.data?.addNewDeviceForUser?.accessToken) {
            setAccessToken(response.data.addNewDeviceForUser?.accessToken)

            let decodedToken = await getUserFromToken()

            const EncryptedSecrets =
              response.data.addNewDeviceForUser.user.EncryptedSecrets

            const bgState: IBackgroundStateSerializable = {
              masterPassword: values.password,
              userId: userId,
              secrets: EncryptedSecrets
            }
            setUserId(decodedToken.userId)

            deviceLogin(bgState)
          } else {
            toast.error(t`Login failed, check your username and password`)
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
        <Text pt={3}>
          <Trans>Don't have account?</Trans>
        </Text>
      </Link>
    </Box>
  )
}
