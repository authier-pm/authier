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
import browser from 'webextension-polyfill'

import { Formik, Form, Field, FormikHelpers } from 'formik'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { toast } from 'react-toastify'
import { t, Trans } from '@lingui/macro'
import { generateEncryptionKey } from '@src/util/generateEncryptionKey'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import cryptoJS from 'crypto-js'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const [showPassword, setShowPassword] = useState(false)

  const { lockedState } = device
  if (!lockedState) {
    return null
  }

  return (
    <Flex flexDirection="column" width="315px" p={4}>
      <Center>
        <LockIcon boxSize="50px" mx={20} my={3}></LockIcon>
      </Center>

      <Formik
        initialValues={{ password: '' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          try {
            const masterEncryptionKey = generateEncryptionKey(
              values.password,
              lockedState.encryptionSalt
            )

            const currentAddDeviceSecret = cryptoJS.AES.decrypt(
              lockedState.authSecretEncrypted,
              masterEncryptionKey,
              {
                iv: cryptoJS.enc.Utf8.parse(lockedState.userId)
              }
            ).toString(cryptoJS.enc.Utf8)

            if (currentAddDeviceSecret !== lockedState.authSecret) {
              throw new Error(t`Incorrect password`)
            }

            device.state = new DeviceState({
              masterEncryptionKey,
              ...lockedState
            })
            await device.state.save()
            device.rerenderViews()
            setSubmitting(false)
          } catch (err: any) {
            console.log(err)

            toast.error(err.message)
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
              isDisabled={props.values.password.length < 3}
              type="submit"
              width="full"
              mt={4}
              isLoading={props.isSubmitting}
            >
              <Trans>Unlock vault</Trans>
            </Button>
          </Form>
        )}
      </Formik>
    </Flex>
  )
}
