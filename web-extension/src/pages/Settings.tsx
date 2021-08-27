import { Flex } from '@chakra-ui/layout'
import {
  Text,
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

export interface Config {
  vaultTime: string
  noHandsLogin: boolean
}

export const Settings = () => {
  const { setSettingsConfig } = useBackground()

  return (
    <Flex flexDirection="column" m={5}>
      <Heading>Security</Heading>
      <Formik
        initialValues={{
          vaultTime: '12 hours',
          noHandsLogin: false
        }}
        onSubmit={async (
          values: Config,
          { setSubmitting }: FormikHelpers<Config>
        ) => {
          alert(JSON.stringify(values, null, 2))
          setSettingsConfig({
            vaultTime: values.vaultTime,
            noHandsLogin: values.noHandsLogin
          })

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
            <Field name="noHandsLogin">
              {/* @ts-expect-error */}
              {({ field, form }) => (
                <FormControl
                  isInvalid={
                    form.errors.noHandsLogin && form.touched.noHandsLogin
                  }
                >
                  <Checkbox {...field} id="noHandsLogin">
                    No Hands login
                  </Checkbox>
                  <FormErrorMessage>
                    {form.errors.noHandsLogin}
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
