import { useContext, useState } from 'react'
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
import {
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { toast } from '@src/ExtensionProviders'
import { useNavigate } from 'react-router-dom'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const { setDeviceState, lockedState, device } = useContext(DeviceStateContext)

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
            const masterEncryptionKey = await generateEncryptionKey(
              values.password,
              base64ToBuffer(lockedState.encryptionSalt)
            )

            const encryptedDataBuff = base64ToBuffer(
              lockedState.authSecretEncrypted
            )
            const iv = encryptedDataBuff.slice(16, 16 + 12)
            const data = encryptedDataBuff.slice(16 + 12)

            const decryptedContent = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv },
              masterEncryptionKey,
              data
            )

            const currentAddDeviceSecret = dec.decode(decryptedContent)

            if (currentAddDeviceSecret !== lockedState.authSecret) {
              throw new Error(t`Incorrect password`)
            }

            setDeviceState({
              masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
              ...lockedState
            })

            device.startLockInterval(lockedState.lockTime)
            navigate('/')

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
