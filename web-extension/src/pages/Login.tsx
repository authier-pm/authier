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
  Heading,
  Spinner
} from '@chakra-ui/react'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import { Link } from 'wouter'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import debug from 'debug'

const log = debug('backgroundPage')

import { getUserFromToken, setAccessToken } from '../util/accessTokenExtension'
import { t, Trans } from '@lingui/macro'

import { UserContext } from '../providers/UserProvider'
import cryptoJS from 'crypto-js'

import { toast } from 'react-toastify'

import { device, DeviceState } from '@src/background/ExtensionDevice'

import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from '../../../shared/Login.codegen'
//import { AuthKey, VaultKey } from '@src/util/encrypt'

interface Values {
  password: string
  email: string
}

export default function Login(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [addNewDevice] = useAddNewDeviceForUserMutation()
  const [deviceDecryptionChallenge, { loading }] =
    useDeviceDecryptionChallengeMutation()
  const { setUserId } = useContext(UserContext)

  const { fireToken } = device
  if (!fireToken) {
    return <Spinner />
  }

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
              deviceId: await device.getDeviceId(),
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

          if (!decryptionChallenge.data?.deviceDecryptionChallenge?.id) {
            toast.error('failed to create decryption challenge')
            return
          }

          const currentSecret = cryptoJS.AES.decrypt(
            addDeviceSecretEncrypted,
            values.password,
            {
              iv: cryptoJS.enc.Utf8.parse(userId)
            }
          ).toString(cryptoJS.enc.Utf8)

          if (!currentSecret) {
            toast.error('wrong password or email')
            return
          }

          const response = await addNewDevice({
            variables: {
              input: {
                deviceId: await device.getDeviceId(),
                ...device.getAddDeviceSecretAuthParams(values.password, userId),
                email: values.email,
                deviceName: device.generateDeviceName(),
                firebaseToken: fireToken,
                decryptionChallengeId:
                  decryptionChallenge.data.deviceDecryptionChallenge.id
              },
              currentAddDeviceSecret: currentSecret
            }
          })

          const addNewDeviceForUser = response.data?.addNewDeviceForUser
          if (addNewDeviceForUser?.accessToken) {
            setAccessToken(addNewDeviceForUser?.accessToken)

            const decodedToken = await getUserFromToken()

            const EncryptedSecrets = addNewDeviceForUser.user.EncryptedSecrets

            const deviceState: IBackgroundStateSerializable = {
              masterEncryptionKey: cryptoJS
                .PBKDF2(
                  values.password,
                  values.email,
                  { iterations: 100000, keySize: 64 } // TODO make customizable
                )
                .toString(cryptoJS.enc.Hex),
              userId: userId,
              secrets: EncryptedSecrets,
              email: values.email
            }
            setUserId(decodedToken.userId)

            device.state = new DeviceState(deviceState)
            device.state.save()
            device.rerenderViews()
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
