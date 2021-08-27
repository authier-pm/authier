import {
  FormControl,
  FormLabel,
  Select,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { SecuritySettings, useBackground } from '@src/util/useBackground'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement } from 'react'

interface Props {}

export default function Security({}: Props): ReactElement {
  const { setSecuritySettings, securityConfig } = useBackground()

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={securityConfig}
        onSubmit={async (
          values: SecuritySettings,
          { setSubmitting }: FormikHelpers<SecuritySettings>
        ) => {
          alert(JSON.stringify(values, null, 2))
          setSecuritySettings({
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
    </>
  )
}
