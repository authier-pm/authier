import {
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  useDisclosure,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Box
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'

import { Field, Formik, FormikHelpers } from 'formik'
import { device } from '@src/background/ExtensionDevice'

import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'
import { EditFormButtons } from '../EditFormButtons'
import { generate } from 'generate-password'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import { defaultPasswordGeneratorConfig } from '@shared/passwordGenerator'

export const AddLogin = () => {
  const navigate = useNavigate()
  const urlQuery = new URLSearchParams(window.location.hash.split('?')[1])

  const [showPassword, setShow] = useState(false)

  const { isOpen } = useDisclosure({
    defaultIsOpen: true
  })
  const handleClick = () => setShow(!showPassword)

  return (
    <Box width={{ base: '90%', sm: '70%', lg: '60%', xl: '70%' }}>
      <Formik
        initialValues={{
          url: urlQuery.get('url') || '',
          password: generate(defaultPasswordGeneratorConfig),
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
          console.log('namePassPair:', namePassPair)

          loginCredentialsSchema.parse(namePassPair)
          await device.state?.addSecrets([
            {
              kind: EncryptedSecretType.LOGIN_CREDENTIALS,
              loginCredentials: namePassPair,
              //TODO: check up on this
              encrypted: await device.state.encrypt(
                JSON.stringify(namePassPair)
              ),
              createdAt: new Date().toJSON()
            }
          ])

          setSubmitting(false)
          navigate(-1)
        }}
      >
        {({ values, handleSubmit, errors, touched, setFieldValue }) => {
          const levelOfPsw = passwordStrength(values.password)
          return (
            <form onSubmit={handleSubmit}>
              <Flex
                p={5}
                flexDirection="column"
                w="inherit"
                sx={{
                  label: {
                    marginBottom: '0px',
                    marginTop: '10px'
                  }
                }}
              >
                <FormControl isInvalid={!!errors.url && touched.url}>
                  <FormLabel htmlFor="url">URL:</FormLabel>
                  <Field
                    as={Input}
                    id="url"
                    name="url"
                    placeholder="google.com"
                  />
                  <FormErrorMessage>{errors.url}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.label && touched.label}>
                  <FormLabel htmlFor="label">Label:</FormLabel>
                  <Field
                    as={Input}
                    id="label"
                    name="label"
                    placeholder="Work email"
                  />
                  <FormErrorMessage>{errors.label}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.username && touched.username}>
                  <FormLabel htmlFor="username">Username:</FormLabel>
                  <Field as={Input} id="username" name="username" />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password && touched.password}>
                  <FormLabel htmlFor="password">Password:</FormLabel>
                  <InputGroup size="md">
                    <Field
                      as={Input}
                      id="password"
                      name="password"
                      pr="4.5rem"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleClick}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Progress
                    value={levelOfPsw.id}
                    size="xs"
                    colorScheme="green"
                    max={3}
                    min={0}
                    mb={1}
                  />

                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>
                <PasswordGenerator
                  isOpen={isOpen}
                  onGenerate={(password) => {
                    setFieldValue('password', password)
                  }}
                />

                <EditFormButtons />
              </Flex>
            </form>
          )
        }}
      </Formik>
    </Box>
  )
}
