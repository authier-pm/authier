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
  Spinner,
  Fade,
  SimpleGrid,
  HStack
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function Account() {
  const email = device.state?.email
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShownNew] = useState(false)

  if (!email) {
    return <Spinner />
  }

  interface Values {
    email: string
    newPassword: string
    currPassword: string
    confirmPassword: string
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <Box textAlign="start" pt={5}>
        <Formik
          initialValues={{
            email: email,
            currPassword: '',
            newPassword: '',
            confirmPassword: ''
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
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <FormLabel htmlFor="email">Email</FormLabel>

                    <Input
                      maxW={'xs'}
                      pr="4.5rem"
                      id="email"
                      {...field}
                      required
                    />

                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <HStack pt={6}>
                <Box as={Field} name="currPassword">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="currPassword">
                        Current password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showCurr ? 'text' : 'currPassword'}
                          placeholder="Master currPassword"
                          id="currPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowCurr(!showCurr)}
                          >
                            {showCurr ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>

                <Box as={Field} name="newPassword">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel htmlFor="newPassword" whiteSpace={'nowrap'}>
                        Set new Master password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showNew ? 'text' : 'newPassword'}
                          placeholder="Master newPassword"
                          id="newPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShownNew(!showNew)}
                          >
                            {showNew ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>

                <Box as={Field} name="confirmPassword">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <FormLabel
                        htmlFor="confirmPassword"
                        whiteSpace={'nowrap'}
                      >
                        Confirm new password
                      </FormLabel>

                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type={showNew ? 'text' : 'confirmPassword'}
                          placeholder="Master confirmPassword"
                          id="confirmPassword"
                          {...field}
                          required
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShownNew(!showNew)}
                          >
                            {showNew ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Box>
              </HStack>

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
    </motion.div>
  )
}
