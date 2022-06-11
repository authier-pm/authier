import {
  Box,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Spinner,
  Flex,
  VStack
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React from 'react'
import { motion } from 'framer-motion'
import { Trans } from '@lingui/macro'
import { Heading } from '@chakra-ui/react'

export default function VaultConfig() {
  const email = device.state?.email

  if (!email) {
    return <Spinner />
  }

  interface Values {
    lockTime: string
    twoFA: string
    homeUI: string
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '60%'
      }}
    >
      <VStack alignItems={'normal'} spacing={20} pb={20}>
        <Box textAlign="start" pt={5}>
          <Heading as="h3" size="lg">
            Vault config
          </Heading>
          <Formik
            initialValues={{
              lockTime: email,
              twoFA: '',
              homeUI: ''
            }}
            onSubmit={async (
              values: Values,
              { setSubmitting }: FormikHelpers<Values>
            ) => {
              setSubmitting(false)
            }}
          >
            {({ isSubmitting, dirty }) => (
              <Form>
                <Field name="email">
                  {({ field, form }) => {
                    return (
                      <Flex>
                        <FormControl
                          isInvalid={form.errors.name && form.touched.name}
                        >
                          <FormLabel htmlFor="email">Login timeout</FormLabel>

                          <Input pr="4.5rem" id="email" {...field} required />

                          <FormErrorMessage>
                            {form.errors.name}
                          </FormErrorMessage>
                        </FormControl>
                      </Flex>
                    )
                  }}
                </Field>

                <Button
                  mt={4}
                  colorScheme="teal"
                  disabled={isSubmitting || !dirty}
                  isLoading={isSubmitting}
                  type="submit"
                >
                  <Trans>Save</Trans>
                </Button>
              </Form>
            )}
          </Formik>
        </Box>
      </VStack>
    </motion.div>
  )
}
