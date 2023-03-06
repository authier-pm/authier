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
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Field } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  useAccountQuery,
  useChangeMasterPasswordMutation
} from './Account.codegen'

import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'

import { CheckIcon, WarningIcon } from '@chakra-ui/icons'
import { NbSp } from '@src/components/util/NbSp'
import { t, Trans } from '@lingui/macro'
import { Heading } from '@chakra-ui/react'
import {
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  decryptDeviceSecretWithPassword,
  generateEncryptionKey
} from '@src/util/generateEncryptionKey'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'

export default function Account() {
  const email = device.state?.email
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShownNew] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const { data } = useAccountQuery()
  const toast = useToast()

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
            Change vault password
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
              { setSubmitting, resetForm }: FormikHelpers<Values>
            ) => {
              try {
                const { addDeviceSecret } =
                  await decryptDeviceSecretWithPassword(
                    values.currPassword,
                    device.state as IBackgroundStateSerializable
                  )

                console.log({ addDeviceSecret })
                if (!addDeviceSecret) {
                  toast({ title: t`Wrong password`, status: 'error' })
                  return
                }

                if (values.newPassword !== values.confirmPassword) {
                  toast({ title: t`Passwords do not match`, status: 'error' })
                  return
                }
                const { state } = device

                if (state && values.newPassword === values.confirmPassword) {
                  const newEncryptionKey = await generateEncryptionKey(
                    values.newPassword,
                    base64ToBuffer(state.encryptionSalt)
                  )

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

                  const secrets = state.secrets

                  const newDeviceSecretsPair =
                    await device.initLocalDeviceAuthSecret(
                      newEncryptionKey,
                      base64ToBuffer(state.encryptionSalt)
                    )

                  await changePassword({
                    variables: {
                      secrets: await device.serializeSecrets(
                        secrets,
                        values.newPassword
                      ),
                      addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
                      addDeviceSecretEncrypted:
                        newDeviceSecretsPair.addDeviceSecretEncrypted,
                      decryptionChallengeId: decryptionChallenge.data
                        ?.deviceDecryptionChallenge?.id as number
                    }
                  })
                  toast({
                    title: t`Password changed, all your other devices will be logged out and you will need to log in again`,
                    status: 'success',
                    duration: null,
                    isClosable: true
                  })

                  resetForm()
                } else {
                  toast({ title: t`Wrong password`, status: 'error' })
                }
                setSubmitting(false)

                return false
              } catch (err: any) {
                console.error(err)
                toast({
                  title: err.message,
                  colorScheme: 'red'
                })
              }
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
                    isDisabled={isSubmitting || !dirty}
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
