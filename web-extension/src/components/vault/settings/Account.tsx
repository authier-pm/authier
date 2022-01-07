import {
  Box,
  Flex,
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  Button,
  Spinner
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React, { useState } from 'react'

export default function Account() {
  const email = device.state?.email
  const [show, setShow] = useState(false)
  const handleClick = () => setShow(!show)

  if (!email) {
    return <Spinner />
  }

  interface Values {
    email: string
    password: string
  }

  return (
    <Box textAlign="start" pt={5}>
      <Formik
        initialValues={{
          email: email,
          password: ''
        }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setSubmitting(false)
        }}
      >
        {({ values }) => (
          <Form>
            <Field name="email">
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.name && form.touched.name}>
                  <FormLabel htmlFor="email">Email</FormLabel>

                  <Input pr="4.5rem" id="email" {...field} required />

                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="password">
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.name && form.touched.name}>
                  <FormLabel htmlFor="password">
                    Set new Master password
                  </FormLabel>

                  <InputGroup size="md">
                    <Input
                      pr="4.5rem"
                      type={show ? 'text' : 'password'}
                      placeholder="Master Password"
                      id="password"
                      {...field}
                      required
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

            <Button
              mt={4}
              colorScheme="teal"
              onClick={() => console.log(values)}
              type="submit"
            >
              Save
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
