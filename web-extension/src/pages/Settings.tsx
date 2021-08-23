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
import { useBackground } from '@src/util/useBackground'

export interface Settings {
  vaultTime: string
  TwoFA: boolean
  NoHandsLogin: boolean
}

export const Settings = () => {
  const { setSafeLockTime } = useBackground()
  return (
    <Flex flexDirection="column" m={5}>
      <Heading>Security</Heading>
      <Formik
        initialValues={{
          vaultTime: '12 hours',
          TwoFA: false,
          NoHandsLogin: false
        }}
        onSubmit={async (
          values: Settings,
          { setSubmitting }: FormikHelpers<Settings>
        ) => {
          if (values.vaultTime === 'On web close') {
            setSafeLockTime(0)
          } else if (values.vaultTime === '10 secconds') {
            setSafeLockTime(10000)
          } else if (values.vaultTime === '8 hours') {
            setSafeLockTime(1000 * 60 * 60 * 8)
          } else if (values.vaultTime === '12 hours') {
            setSafeLockTime(1000 * 60 * 60 * 12)
          }

          if (values.NoHandsLogin) {
          }
          alert(JSON.stringify(values, null, 2))
          setSubmitting(false)
        }}
      >
        {(props) => (
          <Form>
            <Field name="vaultTime">
              {/* @ts-expect-error */}
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.vaultTime && form.touched.vaultTime}
                >
                  <FormLabel htmlFor="vaultTime">Safe lock time</FormLabel>
                  <Select
                    {...field}
                    id="vaultTime"
                    placeholder="Select country"
                    mb={3}
                  >
                    <option>On web close</option>
                    <option>10 secconds</option>
                    <option>8 hours</option>
                    <option>12 hours</option>
                  </Select>
                  <FormErrorMessage>{form.errors.vaultTime}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="TwoFA">
              {/* @ts-expect-error */}
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.TwoFA && form.touched.TwoFA}
                >
                  <FormLabel htmlFor="TwoFA">
                    2FA with (master) mobile phone
                  </FormLabel>
                  <Checkbox {...field} id="TwoFA">
                    Checkbox
                  </Checkbox>
                  <FormErrorMessage>{form.errors.TwoFA}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="NoHandsLogin">
              {/* @ts-expect-error */}
              {({ field, form }) => (
                <FormControl
                  isInvalid={
                    form.errors.NoHandsLogin && form.touched.NoHandsLogin
                  }
                >
                  <FormLabel htmlFor="NoHandsLogin">No Hands login</FormLabel>
                  <Checkbox {...field} id="NoHandsLogin">
                    Checkbox
                  </Checkbox>
                  <FormErrorMessage>
                    {form.errors.NoHandsLogin}
                  </FormErrorMessage>
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
