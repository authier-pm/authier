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
  Tooltip
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
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
  const navigate = useNavigate()

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
        width={{ base: '90%', sm: '70%', md: '60%', lg: '40%' }}
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
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
            <Flex as={Form} width={'80%'} flexDirection="column">
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
                  onClick={() => navigate(-1)}
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
        width={{ base: '90%', sm: '70%', md: '60%', lg: '40%' }}
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={useColorModeValue('white', 'gray.900')}
      >
        <Formik
          enableReinitialize
          initialValues={{
            url: secretProps.url,
            password:
              initPassword === ''
                ? secretProps.loginCredentials.password
                : initPassword,
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
            return (
              <Flex as={Form} flexDirection="column" width={'80%'}>
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
                        value={levelOfPsw.id}
                        size="xs"
                        colorScheme="green"
                        max={3}
                        min={0}
                        mb={1}
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
                    onClick={() => navigate(-1)}
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
        {/* TODO generator is broken for settings */}
        <Tooltip label="Password generator">
          <IconButton
            w="min-content"
            aria-label="Open password generator"
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            m={3}
          />
        </Tooltip>
        <PasswordGenerator isOpen={isOpen} setInitPassword={setInitPassword} />
      </Flex>
    </motion.div>
  )
}

export const VaultItemSettings = () => {
  const params = useParams()

  if (!device.state) {
    return <Spinner></Spinner>
  }

  const secret = device.state.getSecretDecryptedById(params.secretId as string)
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
