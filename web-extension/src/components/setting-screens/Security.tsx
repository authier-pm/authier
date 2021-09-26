import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { SecuritySettings } from '@src/util/useBackgroundState'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement, useContext } from 'react'
import Select from 'react-select'

interface Props {}

export const vaultLockTimeOptions = [
  { value: 0, label: 'On web close' },
  { value: 10000, label: '10 seconds' },
  { value: 288000000, label: '8 hours' },
  { value: 432000000, label: '12 hours' }
]

export default function Security({}: Props): ReactElement {
  const { setSecuritySettings, securityConfig } = useContext(BackgroundContext)

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
            vaultLockTime: values.vaultLockTime,
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
                    options={vaultLockTimeOptions}
                    name={field.name}
                    value={vaultLockTimeOptions.find(
                      (option) => option.value === field.value
                    )}
                    onChange={(option) =>
                      //@ts-expect-error
                      form.setFieldValue(field.name, option.value)
                    }
                    onBlur={field.onBlur}
                    id="vaultTime"
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
