import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button,
  Spinner
} from '@chakra-ui/react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ISecuritySettings } from '@src/util/useDeviceState'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { useContext } from 'react'
import Select from 'react-select'

import { Trans } from '@lingui/macro'
import { useSyncSettingsQuery } from './SecuritySettings.codegen'

export const vaultLockTimeOptions = [
  { value: 0, label: 'On web close' },
  { value: 10000, label: '10 seconds' },
  { value: 288000000, label: '8 hours' },
  { value: 432000000, label: '12 hours' }
]

export const SecuritySettings = () => {
  const { setSecuritySettings } = useContext(DeviceStateContext)

  const { data, loading } = useSyncSettingsQuery()
  if (loading) {
    return <Spinner />
  }

  if (data) {
    return (
      <>
        <Formik
          enableReinitialize
          // @ts-expect-error TODO: fix types
          initialValues={settings}
          onSubmit={async (
            values: ISecuritySettings,
            { setSubmitting }: FormikHelpers<ISecuritySettings>
          ) => {
            alert(JSON.stringify(values, null, 2))
            setSecuritySettings({
              vaultLockTime: values.vaultLockTime,
              noHandsLogin: values.autofill
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
                        //@ts-expect-error TODO: fix types
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
