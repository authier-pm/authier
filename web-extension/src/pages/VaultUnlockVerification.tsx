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

import { Formik, Form, Field, FormikHelpers } from 'formik'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { t, Trans } from '@lingui/macro'
import { generateEncryptionKey } from '@shared/generateEncryptionKey'
import cryptoJS from 'crypto-js'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { toast } from '@src/Providers'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const [showPassword, setShowPassword] = useState(false)

  const { setDeviceState, device } = useContext(DeviceStateContext)

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

            setDeviceState({
              masterEncryptionKey,
              ...lockedState
            })

            device.startLockInterval(lockedState.lockTime)

            device.rerenderViews()
            setSubmitting(false)
          } catch (err: any) {
            console.log(err)

            toast({
              title: err.message,
              status: 'error',
              isClosable: true
            })
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
                    <Heading size="md">Re-enter your Master Password</Heading>
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
