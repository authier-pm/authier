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

import { Field, Form, Formik, FormikHelpers } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretsType } from '@src/generated/graphqlBaseTypes'

interface LoginParsedValues {
  url: string
  label: string
  username: string
  secret: string
}

export const AddTOTP = () => {
  const history = useHistory()

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={{
          url: '',
          secret: '',
          label: '',
          username: ''
        }}
        onSubmit={async (
          values: LoginParsedValues,
          { setSubmitting }: FormikHelpers<LoginParsedValues>
        ) => {
          await device.state?.addSecrets([
            {
              kind: EncryptedSecretsType.TOTP as any,
              totp: values.secret,
              encrypted: device.state!.encrypt(values.secret),
              iconUrl: '',
              label: values.label,
              url: values.url
            }
          ])

          setSubmitting(false)
          history.goBack()
        }}
      >
        {({ values, isSubmitting, dirty }) => {
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
              <Field name="secret">
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="secret">Secret:</FormLabel>

                    <Input id="secret" {...field} required />

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
                  onClick={() => history.push('/')}
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
    </>
  )
}
