import React, { ReactElement, useContext, useEffect, useState } from 'react'
import {
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Box,
  Text,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Spinner,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { Formik, Form, Field, FormikHelpers, FormikState } from 'formik'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import debug from 'debug'

const log = debug('au:Login')

import { t, Trans } from '@lingui/macro'

import { device } from '@src/background/ExtensionDevice'

import { LoginAwaitingApproval } from './LoginAwaitingApproval'
import { IoMdArchive } from 'react-icons/io'
import { Link } from 'react-router-dom'

//import { AuthKey, VaultKey } from '@src/util/encrypt'

export interface LoginFormValues {
  password: string
  email: string
}

// export const isRunningInVault = location.href.includes('/vault.html#')

export default function Login(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState] = useState<LoginFormValues | null>(null)

  if (!device.id) {
    return <Spinner />
  }

  if (formState) {
    return <LoginAwaitingApproval {...formState} />
  }

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg">
      <Flex alignItems="center" justifyContent="center">
        <Heading>Login</Heading>
      </Flex>

      <Formik
        initialValues={{ email: '', password: '' }}
        onSubmit={async (
          values: LoginFormValues,
          { setSubmitting }: FormikHelpers<LoginFormValues>
        ) => {
          setFormState(values)

          setSubmitting(false)
        }}
      >
        {(props) => (
          <Form>
            <Field name="email">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.email && form.touched.email}
                  isRequired
                >
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input {...field} id="Email" placeholder="bob@bob.com" />
                  <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="password">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.password && form.touched.password}
                  isRequired
                >
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="*******"
                    />
                    <InputRightElement width="3rem">
                      <Button
                        h="1.5rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Button
              colorScheme="teal"
              variant="outline"
              type="submit"
              width="full"
              mt={4}
              isLoading={props.isSubmitting}
            >
              <Trans>Login</Trans>
            </Button>
          </Form>
        )}
      </Formik>
      <Flex>
        <Link to="/signup">
          <Text pt={3}>
            <Trans>Don't have account?</Trans>
          </Text>
        </Link>
      </Flex>
    </Box>
  )
}
