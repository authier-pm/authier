import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button,
  Spinner,
  Divider
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { ISecuritySettings } from '@src/util/useBackgroundState'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { useContext } from 'react'
import Select from 'react-select'
import { useSecuritySettingsQuery } from './SecuritySettings.codegen'
import { Trans } from '@lingui/macro'

interface Props {}

export const vaultLockTimeOptions = [
  { value: 0, label: 'On web close' },
  { value: 10000, label: '10 seconds' },
  { value: 288000000, label: '8 hours' },
  { value: 432000000, label: '12 hours' }
]

export const SecuritySettings = ({}: Props) => {
  const { setSecuritySettings } = useContext(BackgroundContext)

  const { data, loading } = useSecuritySettingsQuery()
  if (loading) {
    return <Spinner />
  }
  const settings = data?.me?.settings
  if (settings) {
    return (
      <>
        <Formik
          enableReinitialize
          // @ts-expect-error
          initialValues={settings}
          onSubmit={async (
            values: ISecuritySettings,
            { setSubmitting }: FormikHelpers<ISecuritySettings>
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
                <Trans>Save</Trans>
              </Button>
            </Form>
          )}
        </Formik>
      </>
    )
  }
  return null
}
