import { Flex } from '@chakra-ui/layout'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  StackDivider,
  VStack
} from '@chakra-ui/react'
import { Formik, Form, Field, FormikHelpers } from 'formik'
import React from 'react'

export const Settings = () => {
  return (
    <Flex flexDirection="column">
      <Heading>Security</Heading>
      <Formik
        initialValues={{ vaultTime: 'Sasuke', TwoFA: false }}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            actions.setSubmitting(false)
          }, 1000)
        }}
      >
        {(props) => (
          <Form>
            <Field name="vaultTime">
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.vaultTime && form.touched.vaultTime}
                >
                  <FormLabel htmlFor="vaultTime"></FormLabel>
                  <Select
                    {...field}
                    id="vaultTime"
                    placeholder="Select country"
                  >
                    <option>United Arab Emirates</option>
                    <option>Nigeria</option>
                  </Select>
                  <FormErrorMessage>{form.errors.vaultTime}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="TwoFA">
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.TwoFA && form.touched.TwoFA}
                >
                  <FormLabel htmlFor="TwoFA">2FA with mobile phone</FormLabel>
                  <Checkbox {...field} id="TwoFA" defaultIsChecked>
                    Checkbox
                  </Checkbox>
                  <FormErrorMessage>{form.errors.TwoFA}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Button
              mt={4}
              colorScheme="teal"
              isLoading={props.isSubmitting}
              type="submit"
            >
              Submit
            </Button>
          </Form>
        )}
      </Formik>
    </Flex>
  )
}
