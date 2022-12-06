import {
  Stack,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  IconButton,
  useDisclosure,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Tooltip,
  Box
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'

import { Field, Formik, FormikHelpers } from 'formik'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { device } from '@src/background/ExtensionDevice'

import { loginCredentialsSchema } from '@src/util/loginCredentialsSchema'
import { EncryptedSecretType } from '../../../../../shared/generated/graphqlBaseTypes'
import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'

export const AddLogin = () => {
  const navigate = useNavigate()

  const [show, setShow] = useState(false)
  const [initPassword, setInitPassword] = useState('')

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)

  return (
    <Box width={{ base: '90%', sm: '70%', lg: '60%', xl: '70%' }}>
      <Formik
        enableReinitialize
        initialValues={{
          url: '',
          password: initPassword,
          label: '',
          username: ''
        }}
        validationSchema={PasswordSchema}
        onSubmit={async (
          values: credentialValues,
          { setSubmitting }: FormikHelpers<credentialValues>
        ) => {
          const namePassPair = {
            password: values.password,
            username: values.username,
            url: values.url,
            label: values.label,
            iconUrl: null
          }

          loginCredentialsSchema.parse(namePassPair)

          await device.state?.addSecrets([
            {
              kind: EncryptedSecretType.LOGIN_CREDENTIALS,
              loginCredentials: namePassPair,
              encrypted: device.state.encrypt(JSON.stringify(namePassPair)),
              createdAt: new Date().toJSON()
            }
          ])

          setSubmitting(false)
          navigate(-1)
        }}
      >
        {({ values, isSubmitting, dirty, handleSubmit, errors, touched }) => {
          const levelOfPsw = passwordStrength(values.password)
          return (
            <form onSubmit={handleSubmit}>
              <Flex p={5} flexDirection="column" w="inherit">
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

                <FormControl isInvalid={!!errors.username && touched.username}>
                  <FormLabel htmlFor="username">Username:</FormLabel>
                  <Field as={Input} id="username" name="username" />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password && touched.password}>
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
                    onClick={() => navigate('/')}
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
            </form>
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
    </Box>
  )
}
