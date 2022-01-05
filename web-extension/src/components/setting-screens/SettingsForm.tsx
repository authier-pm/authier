import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement, useContext } from 'react'
import Select from 'react-select'

interface Props {}

export enum UIOptions {
  loginAndTOTP = 'loginAndTOTP',
  all = 'all',
  byDomain = 'byDomain'
}

export interface UISettings {
  homeList: UIOptions
}

const options = [
  { value: UIOptions.all, label: t`All` },
  { value: UIOptions.loginAndTOTP, label: t`TOTP & Login credentials` },
  { value: UIOptions.byDomain, label: t`Current domain` }
]

export function SettingsForm({}: Props): ReactElement {
  const { setUISettings, UIConfig } = useContext(DeviceStateContext)
  return (
    <>
      <Formik
        enableReinitialize
        initialValues={UIConfig}
        onSubmit={async (
          values: UISettings,
          { setSubmitting }: FormikHelpers<UISettings>
        ) => {
          alert(JSON.stringify(values, null, 2))
          setUISettings(values)
          setSubmitting(false)
        }}
      >
        {(props) => (
          <Form>
            <Field name="homeList">
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.homeList && form.touched.homeList}
                >
                  <FormLabel htmlFor="homeList">Home list</FormLabel>
                  <Select
                    options={options}
                    name={field.name}
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
                    id="homeList"
                  />
                  <FormErrorMessage>{form.errors.homeList}</FormErrorMessage>
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
