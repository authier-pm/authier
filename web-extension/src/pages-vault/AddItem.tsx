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
  Tooltip,
  Select
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'

import {
  Field,
  Form,
  Formik,
  FormikHelpers,
  useField,
  useFormikContext
} from 'formik'
import { motion } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@src/util/loginCredentialsSchema'

interface LoginParsedValues {
  url: string
  label: string
  username: string
  password: string
}

export const AddItem = () => {
  const history = useHistory()
  const [show, setShow] = useState(false)
  const [initPassword, setInitPassword] = useState('')

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <Flex
        width={{ base: '90%', sm: '70%', md: '50%' }}
        mt={4}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={useColorModeValue('white', 'gray.900')}
      >
        <Select defaultValue={'Login'} placeholder="Select type" w={'50%'}>
          <option value="TOTP">TOTP</option>
          <option value="Login">Login</option>
        </Select>

        <Formik
          enableReinitialize
          initialValues={{
            url: '',
            password: initPassword,
            label: '',
            username: ''
          }}
          onSubmit={async (
            values: LoginParsedValues,
            { setSubmitting }: FormikHelpers<LoginParsedValues>
          ) => {
            const namePassPair = {
              username: values.username,
              password: values.password
            }

            loginCredentialsSchema.parse(namePassPair)

            await device.state?.addSecrets([
              {
                kind: EncryptedSecretType.LOGIN_CREDENTIALS,
                loginCredentials: namePassPair,
                encrypted: device.state.encrypt(JSON.stringify(namePassPair)),
                iconUrl: null,
                url: values.url,
                label: values.label
              }
            ])

            setSubmitting(false)
            history.goBack()
          }}
        >
          {({ values, isSubmitting, dirty }) => {
            const levelOfPsw = passwordStrength(values.password)
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
                    aria-label="Create"
                  >
                    Create
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
        <PasswordGenerator isOpen={isOpen} setInitPassword={setInitPassword} />
      </Flex>
    </motion.div>
  )
}
