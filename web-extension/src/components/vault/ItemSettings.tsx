import {
  Box,
  Center,
  Heading,
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
  SimpleGrid,
  Spinner,
  Alert,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Tooltip
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import {
  ArrowForwardIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@chakra-ui/icons'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import { useUpdateEncryptedSecretMutation } from './ItemSettings.codegen'
import { Field, Form, Formik, FormikHelpers } from 'formik'
import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { log } from 'debug'

enum Value {
  'Tooweak' = 1,
  'Weak' = 2,
  'Medium' = 3,
  'Strong' = 4
}

interface totpValues {
  secret: string
  url: string
  label: string
}

const TOTPSecret = (data: ITOTPSecret) => {
  const history = useHistory()
  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [show, setShow] = useState(false)

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Flex
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        w={['400px', '600px']}
        minW={'420px'}
        m="auto"
        bg={useColorModeValue('white', 'gray.900')}
      >
        <Formik
          initialValues={{
            secret: data.totp,
            url: data.url,
            label: data.label
          }}
          onSubmit={async (
            values: totpValues,
            { setSubmitting }: FormikHelpers<totpValues>
          ) => {
            const secret = device.state?.secrets.find(
              ({ id }) => id === data.id
            )

            if (secret && device.state) {
              secret.encrypted = device.state.encrypt(data.totp)
              secret.label = values.label
              secret.url = values.url

              await updateSecret({
                variables: {
                  id: data.id,
                  patch: {
                    encrypted: secret.encrypted,
                    label: values.label,
                    url: values.url,
                    kind: data.kind
                  }
                }
              })

              await device.state?.save()
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting, dirty }) => (
            <Flex as={Form} p={5} flexDirection="column" w="inherit">
              <Field name="url">
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="url">URL:</FormLabel>

                    <Input id="url" {...field} required />

                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="label">
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="label">Label:</FormLabel>

                    <Input id="label" {...field} required />

                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="secret">
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="secret">Secret:</FormLabel>

                    <InputGroup size="md">
                      <Input
                        id="secret"
                        pr="4.5rem"
                        type={show ? 'text' : 'password'}
                        {...field}
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

                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Stack
                direction={'row'}
                justifyContent="flex-end"
                spacing={1}
                my={5}
                alignItems={'baseline'}
              >
                <Button
                  _focus={{
                    bg: 'gray.200'
                  }}
                  fontSize={'sm'}
                  size="sm"
                  onClick={() => history.goBack()}
                >
                  Go back
                </Button>
                <Button
                  disabled={isSubmitting || !dirty}
                  isLoading={isSubmitting}
                  type="submit"
                  size={'sm'}
                  fontSize={'sm'}
                  bg={'blue.400'}
                  color={'white'}
                  boxShadow={
                    '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
                  }
                  _hover={{
                    bg: 'blue.500'
                  }}
                  _focus={{
                    bg: 'blue.500'
                  }}
                  aria-label="Save"
                >
                  Save
                </Button>
              </Stack>
            </Flex>
          )}
        </Formik>
      </Flex>
    </motion.div>
  )
}

interface LoginParsedValues {
  url: string
  label: string
  username: string
  password: string
}

const LoginSecret = (secretProps: ILoginSecret) => {
  const history = useHistory()
  const [show, setShow] = useState(false)

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)

  const [updateSecret] = useUpdateEncryptedSecretMutation()

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Flex
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        w={['400px', '600px']}
        minW={'420px'}
        m="auto"
        bg={useColorModeValue('white', 'gray.900')}
      >
        <Formik
          initialValues={{
            url: secretProps.url,
            password: secretProps.loginCredentials.password,
            label: secretProps.label,
            username: secretProps.loginCredentials.username
          }}
          onSubmit={async (
            values: LoginParsedValues,
            { setSubmitting }: FormikHelpers<LoginParsedValues>
          ) => {
            const secret = device.state?.secrets.find(
              ({ id }) => id === secretProps.id
            )
            if (secret && device.state) {
              secret.encrypted = device.state.encrypt(
                JSON.stringify({
                  username: values.username,
                  password: values.password
                })
              )
              secret.url = values.url
              secret.label = values.label

              await updateSecret({
                variables: {
                  id: secretProps.id,
                  patch: {
                    encrypted: secret.encrypted,
                    label: values.label,
                    url: values.url,
                    kind: secretProps.kind
                  }
                }
              })

              await device.state?.save()
              setSubmitting(false)
            }
          }}
        >
          {({ values, isSubmitting, dirty }) => {
            const levelOfPsw = passwordStrength(values.password)
              .value.split(' ')
              .join('')
            return (
              <Flex as={Form} p={5} flexDirection="column" w="inherit">
                <Field name="url">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="url">URL:</FormLabel>

                      <Input id="url" {...field} required />

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="label">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="label">Label:</FormLabel>

                      <Input id="label" {...field} required />

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="username">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="username">Username:</FormLabel>

                      <Input id="username" {...field} required />

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="password">Password</FormLabel>

                      <Progress
                        value={Value[levelOfPsw]}
                        size="xs"
                        colorScheme="green"
                        max={4}
                        mb={1}
                        defaultValue={0}
                      />
                      <InputGroup size="md">
                        <Input
                          {...field}
                          pr="4.5rem"
                          type={show ? 'text' : 'password'}
                        />
                        <InputRightElement width="4.5rem">
                          <Button h="1.75rem" size="sm" onClick={handleClick}>
                            {show ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                {secretProps.loginCredentials.parseError && (
                  <Alert status="error" mt={4}>
                    <Trans>Failed to parse this secret:</Trans>
                    {JSON.stringify(secretProps.loginCredentials.parseError)}
                  </Alert>
                )}
                <Stack
                  direction={'row'}
                  justifyContent="flex-end"
                  spacing={1}
                  my={5}
                  alignItems={'baseline'}
                >
                  <Button
                    _focus={{
                      bg: 'gray.200'
                    }}
                    fontSize={'sm'}
                    size="sm"
                    onClick={() => history.goBack()}
                  >
                    Go back
                  </Button>
                  <Button
                    disabled={isSubmitting || !dirty}
                    isLoading={isSubmitting}
                    type="submit"
                    size={'sm'}
                    fontSize={'sm'}
                    bg={'blue.400'}
                    color={'white'}
                    boxShadow={
                      '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
                    }
                    _hover={{
                      bg: 'blue.500'
                    }}
                    _focus={{
                      bg: 'blue.500'
                    }}
                    aria-label="Save"
                  >
                    Save
                  </Button>
                </Stack>
              </Flex>
            )
          }}
        </Formik>

        <Tooltip label="Password generator">
          <IconButton
            w="min-content"
            aria-label="Open password generator"
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            m={3}
          />
        </Tooltip>
        <PasswordGenerator isOpen={isOpen} />
      </Flex>
    </motion.div>
  )
}

export const VaultItemSettings = ({ secretId }) => {
  if (!device.state) {
    return <Spinner></Spinner>
  }

  const secret = device.state.getSecretDecryptedById(secretId)
  if (!secret) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }
  if (secret.kind === 'TOTP') {
    return <TOTPSecret {...secret} />
  } else if (secret.kind === 'LOGIN_CREDENTIALS') {
    return <LoginSecret {...secret} />
  }

  return null
}
