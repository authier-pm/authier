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
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Field } from 'formik'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  useAccountQuery,
  useChangeMasterPasswordMutation
} from './Account.codegen'

import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'
import { toast } from 'react-toastify'
import { CheckIcon, WarningIcon } from '@chakra-ui/icons'

import { Trans } from '@lingui/macro'
import { Heading } from '@chakra-ui/react'
import { device } from 'src/background/ExtensionDevice'
import { NbSp } from 'src/components/util/NbSp'

export default function Account() {
  const email = device.state?.email
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShownNew] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const { data } = useAccountQuery()

  if (!email) {
    return <Spinner />
  }

  interface Values {
    email: string
    newPassword: string
    currPassword: string
    confirmPassword: string
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'contents'
      }}
    >
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
        spacing={20}
        rounded={'lg'}
        boxShadow={'lg'}
        p={30}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <Box>
          <Heading as="h3" size="lg" mb={5}>
            Change master password
          </Heading>
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
              console.log(values.newPassword)
              if (
                values.newPassword === values.confirmPassword &&
                values.currPassword === device.state?.masterEncryptionKey
              ) {
                const decryptionChallenge = await deviceDecryptionChallenge({
                  variables: {
                    deviceInput: {
                      id: device.id as string,
                      name: device.name,
                      platform: device.platform
                    },
                    email: values.email
                  }
                })

                const secrets = device.state.secrets

                const { state } = device

                await changePassword({
                  variables: {
                    secrets: device.serializeSecrets(
                      secrets,
                      values.newPassword
                    ),
                    addDeviceSecret: state.authSecret,
                    addDeviceSecretEncrypted: state.authSecretEncrypted,
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
            {({ isSubmitting, dirty, touched, handleSubmit, errors }) => (
              <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="flex-start">
                  <FormControl
                    isRequired
                    isInvalid={!!errors.email && touched.email}
                  >
                    <FormLabel htmlFor="email">
                      Email
                      <NbSp />
                      {data?.me?.primaryEmailVerification?.verifiedAt ? (
                        <CheckIcon boxSize={18} />
                      ) : (
                        <WarningIcon boxSize={18} />
                      )}
                    </FormLabel>
                    <Field as={Input} id="email" name="email" type="email" />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  {/*  */}

                  <FormControl
                    isRequired
                    isInvalid={!!errors.currPassword && touched.currPassword}
                  >
                    <FormLabel htmlFor="currPassword">
                      <Trans>Current password</Trans>
                    </FormLabel>

                    <InputGroup size="md">
                      <Field
                        as={Input}
                        pr="4.5rem"
                        type={showCurr ? 'text' : 'password'}
                        placeholder="Master password"
                        id="currPassword"
                        name="currPassword"
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

                    <FormErrorMessage>{errors.currPassword}</FormErrorMessage>
                  </FormControl>

                  {/*  */}

                  <FormControl
                    isRequired
                    isInvalid={!!errors.newPassword && touched.newPassword}
                  >
                    <FormLabel htmlFor="newPassword" whiteSpace={'nowrap'}>
                      <Trans>Set new Master password</Trans>
                    </FormLabel>

                    <InputGroup size="md">
                      <Field
                        as={Input}
                        pr="4.5rem"
                        type={showNew ? 'text' : 'password'}
                        placeholder="New master password"
                        id="newPassword"
                        name="newPassword"
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

                    <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                  </FormControl>

                  {/*  */}

                  <FormControl
                    isRequired
                    isInvalid={
                      !!errors.confirmPassword && touched.confirmPassword
                    }
                  >
                    <FormLabel htmlFor="confirmPassword" whiteSpace={'nowrap'}>
                      <Trans>Confirm new password</Trans>
                    </FormLabel>

                    <InputGroup size="md">
                      <Field
                        as={Input}
                        pr="4.5rem"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Confirm password"
                        id="confirmPassword"
                        name="confirmPassword"
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

                    <FormErrorMessage>
                      {errors.confirmPassword}
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    mt={4}
                    colorScheme="teal"
                    disabled={isSubmitting || !dirty}
                    isLoading={isSubmitting}
                    type="submit"
                  >
                    <Trans>Set master password</Trans>
                  </Button>
                </VStack>
              </form>
            )}
          </Formik>
        </Box>

        <Box>
          <Heading as="h3" size="lg" color={'red'} mb={5}>
            <Trans>Danger zone</Trans>
          </Heading>
          <Button colorScheme={'red'}>Delete your account</Button>
        </Box>
      </VStack>
    </motion.div>
  )
}
