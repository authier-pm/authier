import {
  Stack,
  useColorModeValue,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  IconButton,
  useDisclosure,
  Spinner,
  Alert,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Tooltip,
  Box
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { Field, Formik, FormikHelpers } from 'formik'
import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import {
  TOTPSchema,
  totpValues,
  credentialValues
} from '@shared/formikSharedTypes'
import { EditFormButtons } from './EditFormButtons'
import { DeleteSecretButton } from '@src/pages-vault/DeleteSecretButton'

const TOTPSecret = (secretProps: ITOTPSecret) => {
  const { totp } = secretProps
  const navigate = useNavigate()

  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [show, setShow] = useState(false)

  const bg = useColorModeValue('white', 'gray.800')

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <DeleteSecretButton secret={secretProps} />
      <Flex
        width={{ base: '90%', sm: '70%', md: '60%' }}
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={bg}
      >
        <Formik
          initialValues={{
            secret: totp.secret,
            url: totp.url!!,
            label: totp.label,
            digits: totp.digits,
            period: totp.period
          }}
          validationSchema={TOTPSchema}
          onSubmit={async (
            values: totpValues,
            { setSubmitting }: FormikHelpers<totpValues>
          ) => {
            const secret = device.state?.secrets.find(
              ({ id }) => id === secretProps.id
            )

            if (secret && device.state) {
              secret.encrypted = await device.state.encrypt(
                JSON.stringify({
                  ...values,
                  iconUrl: '',
                  digits: 6,
                  period: 30
                })
              )

              await updateSecret({
                variables: {
                  id: secret.id,
                  patch: {
                    encrypted: secret.encrypted,
                    kind: secret.kind
                  }
                }
              })

              await device.state?.save()
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting, dirty, handleSubmit, errors, touched }) => (
            <Box width={'80%'} mt={5}>
              <form onSubmit={handleSubmit}>
                <Flex flexDirection="column">
                  <FormControl isInvalid={!!errors.url && touched.url}>
                    <FormLabel htmlFor="url">URL:</FormLabel>
                    <Field as={Input} id="url" name="url" />
                    <FormErrorMessage>{errors.url}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.label && touched.label}>
                    <FormLabel htmlFor="label">Label:</FormLabel>
                    <Field as={Input} id="label" name="label" />
                    <FormErrorMessage>{errors.label}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.secret && touched.secret}>
                    <FormLabel htmlFor="secret">Secret:</FormLabel>
                    <InputGroup size="md">
                      <Field
                        id="secret"
                        pr="4.5rem"
                        type={show ? 'text' : 'password'}
                        as={Input}
                        name="secret"
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShow(!show)}
                        >
                          {show ? 'Hide' : 'Show'}
                        </Button>
                      </InputRightElement>
                    </InputGroup>

                    <FormErrorMessage>{errors.secret}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.digits && touched.digits}>
                    <FormLabel htmlFor="digits">Digits:</FormLabel>
                    <Field as={Input} id="digits" name="digits" />
                    <FormErrorMessage>{errors.digits}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.period && touched.period}>
                    <FormLabel htmlFor="period">Period:</FormLabel>
                    <Field as={Input} id="period" name="period" />
                    <FormErrorMessage>{errors.period}</FormErrorMessage>
                  </FormControl>

                  <EditFormButtons />
                </Flex>
              </form>
            </Box>
          )}
        </Formik>
      </Flex>
    </motion.div>
  )
}

const LoginSecret = (secretProps: ILoginSecret) => {
  const navigate = useNavigate()

  const [show, setShow] = useState(false)

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)
  const [initPassword, setInitPassword] = useState('')

  const [updateSecret] = useUpdateEncryptedSecretMutation()

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <Flex
        width={{ base: '90%', sm: '70%', md: '60%' }}
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <DeleteSecretButton secret={secretProps} />

        <Formik
          enableReinitialize
          initialValues={{
            url: secretProps.loginCredentials.url,
            password:
              initPassword === ''
                ? secretProps.loginCredentials.password
                : initPassword,
            label: secretProps.loginCredentials.label,
            username: secretProps.loginCredentials.username
          }}
          onSubmit={async (
            values: credentialValues,
            { setSubmitting }: FormikHelpers<credentialValues>
          ) => {
            const secret = device.state?.secrets.find(
              ({ id }) => id === secretProps.id
            )
            if (secret && device.state) {
              secret.encrypted = await device.state.encrypt(
                JSON.stringify({
                  password: values.password,
                  username: values.username,
                  url: values.url,
                  label: values.label,
                  iconUrl: null
                })
              )

              await updateSecret({
                variables: {
                  id: secretProps.id,
                  patch: {
                    encrypted: secret.encrypted,
                    kind: secretProps.kind
                  }
                }
              })

              await device.state?.save()
              setSubmitting(false)
            }
          }}
        >
          {({ values, isSubmitting, dirty, handleSubmit, errors, touched }) => {
            const levelOfPsw = passwordStrength(values.password)
            return (
              <Box w={'80%'}>
                <form onSubmit={handleSubmit}>
                  <Flex mt={3} flexDirection="column">
                    <FormControl isInvalid={!!errors.url && touched.url}>
                      <FormLabel htmlFor="url">URL:</FormLabel>
                      <Field as={Input} id="url" name="url" />
                      <FormErrorMessage>{errors.url}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.label && touched.label}>
                      <FormLabel htmlFor="label">Label:</FormLabel>
                      <Field as={Input} id="label" name="label" />
                      <FormErrorMessage>{errors.label}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={!!errors.username && touched.username}
                    >
                      <FormLabel htmlFor="username">Username:</FormLabel>
                      <Field as={Input} id="username" name="username" />
                      <FormErrorMessage>{errors.username}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={!!errors.password && touched.password}
                    >
                      <FormLabel htmlFor="password">Password:</FormLabel>
                      <Progress
                        value={levelOfPsw.id}
                        size="xs"
                        colorScheme="green"
                        max={3}
                        min={0}
                        mb={1}
                      />

                      <InputGroup size="md">
                        <Field
                          as={Input}
                          id="password"
                          name="password"
                          pr="4.5rem"
                          type={show ? 'text' : 'password'}
                        />
                        <InputRightElement width="4.5rem">
                          <Button h="1.75rem" size="sm" onClick={handleClick}>
                            {show ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    {secretProps.loginCredentials.parseError && (
                      <Alert status="error" mt={4}>
                        <Trans>Failed to parse this secret:</Trans>
                        {JSON.stringify(
                          secretProps.loginCredentials.parseError
                        )}
                      </Alert>
                    )}
                    <Tooltip label="Password generator">
                      <IconButton
                        w="min-content"
                        aria-label="Open password generator"
                        icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        onClick={onToggle}
                        m={3}
                      />
                    </Tooltip>
                    <PasswordGenerator
                      isOpen={isOpen}
                      setInitPassword={setInitPassword}
                    />
                    <EditFormButtons />
                  </Flex>
                </form>
              </Box>
            )
          }}
        </Formik>
      </Flex>
    </motion.div>
  )
}

export const VaultItemSettings = () => {
  const [secret, setSecret] = useState<
    ITOTPSecret | ILoginSecret | undefined | null
  >(null)
  const params = useParams()

  useEffect(() => {
    async function loadSecret() {
      const secret = await device.state?.getSecretDecryptedById(
        params.secretId as string
      )
      setSecret(secret)
    }
    loadSecret()
  }, [])

  if (!device.state && !secret) {
    return <Spinner />
  }

  if (!secret) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }

  console.log('secret', secret)
  if (secret.kind === 'TOTP') {
    return <TOTPSecret {...secret} />
  } else if (secret.kind === 'LOGIN_CREDENTIALS') {
    return <LoginSecret {...secret} />
  }

  return null
}
