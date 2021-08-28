import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { SecuritySettings, useBackground } from '@src/util/useBackground'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement } from 'react'
import Select from 'react-select'

interface Props {}

const options = [
  { value: 'On web close', label: 'On web close' },
  { value: '10 secconds', label: '10 secconds' },
  { value: '8 hours', label: '8 hours' },
  { value: '12 hours', label: '12 hours' }
]

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
                    options={options}
                    name={field.name}
                    //@ts-expect-error
                    value={
                      options
                        ? options.find((option) => option.value === field.value)
                        : ''
                    }
                    onChange={(option) =>
                      //@ts-expect-error
                      form.setFieldValue(field.name, option.value)
                    }
                    onBlur={field.onBlur}
                    id="vaultTime"
                    mb={3}
                  />
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
