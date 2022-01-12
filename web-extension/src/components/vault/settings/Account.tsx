import {
  Box,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  Button,
  Spinner,
  HStack
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useChangeMasterPasswordMutation } from './Account.codegen'
import * as Yup from 'yup'
import { useDeviceDecryptionChallengeMutation } from '../../../../../shared/Login.codegen'
import { toast } from 'react-toastify'

export default function Account() {
  const email = device.state?.email
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShownNew] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()

  if (!email) {
    return <Spinner />
  }

  interface Values {
    email: string
    newPassword: string
    currPassword: string
    confirmPassword: string
  }

  const ChangePasswordSchema = Yup.object().shape({
    newPassword: Yup.string()
      .min(4, 'Too Short!')
      .max(50, 'Too Long!')
      .required('Required'),
    currPassword: Yup.string()
      .min(4, 'Too Short!')
      .max(50, 'Too Long!')
      .required('Required'),
    confirmPassword: Yup.string()
      .min(4, 'Too Short!')
      .max(50, 'Too Long!')
      .required('Required'),
    email: Yup.string().email('Invalid email').required('Required')
  })

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <Box textAlign="start" pt={5}>
        <Formik
          initialValues={{
            email: email,
            currPassword: '',
            newPassword: '',
            confirmPassword: ''
          }}
          onSubmit={async (
            values: Values,
            { setSubmitting }: FormikHelpers<Values>
          ) => {
            if (
              values.newPassword === values.confirmPassword &&
              values.currPassword === device.state?.masterEncryptionKey
            ) {
              const decryptionChallenge = await deviceDecryptionChallenge({
                variables: {
                  deviceId: await device.getDeviceId(),
                  email: values.email
                }
              })

              const secrets = device.state.secrets
              const userId =
                decryptionChallenge.data?.deviceDecryptionChallenge?.user.id

              const secretAuthTuple = device.getAddDeviceSecretAuthParams(
                values.newPassword,
                userId as string
              )
              console.log('~ secretAuthTuple', secretAuthTuple)
              await changePassword({
                variables: {
                  secrets: device.serializeSecrets(secrets, values.newPassword),
                  ...secretAuthTuple,
                  decryptionChallengeId: decryptionChallenge.data
                    ?.deviceDecryptionChallenge?.id as number
                }
              })
              await device.logout()
            } else {
              toast.warning('Wrong password')
            }
            setSubmitting(false)

            return false
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="email">
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="email">Email</FormLabel>

                    <Input
                      maxW={'xs'}
                      pr="4.5rem"
                      id="email"
                      {...field}
                      required
                    />

                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <HStack pt={6}>
                <Box as={Field} name="currPassword">
                  {({ field, form }) => (
                    <FormControl
                      isRequired
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="currPassword">
                        Current password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showCurr ? 'text' : 'password'}
                          placeholder="Master currPassword"
                          id="currPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowCurr(!showCurr)}
                          >
                            {showCurr ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>

                <Box as={Field} name="newPassword">
                  {({ field, form }) => (
                    <FormControl
                      isRequired
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="newPassword" whiteSpace={'nowrap'}>
                        Set new Master password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showNew ? 'text' : 'password'}
                          placeholder="Master newPassword"
                          id="newPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShownNew(!showNew)}
                          >
                            {showNew ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>

                <Box as={Field} name="confirmPassword">
                  {({ field, form }) => (
                    <FormControl
                      isRequired
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel
                        htmlFor="confirmPassword"
                        whiteSpace={'nowrap'}
                      >
                        Confirm new password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Master confirmPassword"
                          id="confirmPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPass(!showPass)}
                          >
                            {showPass ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>
              </HStack>

              <Button
                mt={4}
                colorScheme="teal"
                isLoading={isSubmitting}
                type="submit"
              >
                Save
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </motion.div>
  )
}
