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
import { useBackground } from '@src/util/backgroundState'

export const Settings = () => {
  const { setSafeLockTime } = useBackground()
  return (
    <Flex flexDirection="column">
      <Heading>Security</Heading>
      <Formik
        initialValues={{ vaultTime: '1 hour', TwoFA: false }}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            if (values.vaultTime === 'On web close') {
              setSafeLockTime(0)
            } else if (values.vaultTime === '10 secconds') {
              setSafeLockTime(10000)
            } else if (values.vaultTime === '8 hours') {
              setSafeLockTime(1000 * 60 * 60 * 8)
            } else if (values.vaultTime === '12 hours') {
              setSafeLockTime(1000 * 60 * 60 * 12)
            }
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
                  <FormLabel htmlFor="vaultTime">Safe lock time</FormLabel>
                  <Select
                    {...field}
                    id="vaultTime"
                    placeholder="Select country"
                  >
                    <option>On web close</option>
                    <option>1 hour</option>
                    <option>8 hours</option>
                    <option>12 hours</option>
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
                  <FormLabel htmlFor="TwoFA">
                    2FA with (main) mobile phone
                  </FormLabel>
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
              Save
            </Button>
          </Form>
        )}
      </Formik>
    </Flex>
  )
}
