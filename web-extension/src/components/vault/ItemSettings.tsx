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
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import { useUpdateEncryptedSecretMutation } from './ItemSettings.codegen'
import { Field, Form, Formik, FormikHelpers } from 'formik'
import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'

enum Value {
  'Tooweak' = 1,
  'Weak' = 2,
  'Medium' = 3,
  'Strong' = 4
}

const InputWithHeading = ({
  defaultValue,
  heading
}: {
  defaultValue: string
  heading: string
}) => {
  return (
    <Box flex={'50%'}>
      <Heading size="md" as="h5">
        {heading}
      </Heading>
      <Input defaultValue={defaultValue} />
    </Box>
  )
}

const TOTPSecret = (data: ITOTPSecret) => {
  const history = useHistory()
  const [secret, setSecret] = useState<string>(data.totp)
  const [show, setShow] = useState(false)
  const handleChangeSecret = (event: any) => {
    setSecret(event.target.value)
  }
  const handleClick = () => setShow(!show)
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Center
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
        <Flex p={5} flexDirection="column" w="inherit">
          <SimpleGrid row={2} columns={2} spacing="40px">
            <InputWithHeading heading="URL:" defaultValue={data.url} />
            <InputWithHeading heading="Label:" defaultValue={data.label} />

            <Box flex={'50%'}>
              <Heading size="md" as="h5">
                Secret:
              </Heading>

              <InputGroup size="md">
                <Input
                  value={secret}
                  onChange={handleChangeSecret}
                  pr="4.5rem"
                  type={show ? 'text' : 'password'}
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={handleClick}>
                    {show ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
          </SimpleGrid>

          <Stack direction={'row'} justifyContent="flex-end" spacing={1} my={5}>
            <Button
              colorScheme="blackAlpha"
              size="sm"
              onClick={() => history.goBack()}
            >
              Go back
            </Button>
            <Button colorScheme="twitter" size="sm">
              Save
            </Button>
          </Stack>
        </Flex>
      </Center>
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

              await updateSecret({
                variables: {
                  id: secretProps.id,
                  patch: {
                    //Finish here the string
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
          {({ values, setSubmitting }) => {
            const levelOfPsw = passwordStrength(values.password)
              .value.split(' ')
              .join('')
            return (
              <Flex p={5} as={Form} flexDirection="column" w="inherit">
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
                >
                  <Button
                    colorScheme="blackAlpha"
                    size="sm"
                    onClick={() => history.goBack()}
                    type="button"
                  >
                    Go back
                  </Button>
                  <Button
                    colorScheme="twitter"
                    size="sm"
                    type="submit"
                    onClick={async () => {
                      setSubmitting(true)
                    }}
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
