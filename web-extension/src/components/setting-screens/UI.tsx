import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { useBackground } from '@src/util/useBackground'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement } from 'react'
import Select from 'react-select'

interface Props {}

export interface UISettings {
  homeList: 'All' | 'TOTP & Login credencials' | 'Current domain'
}

const options = [
  { value: 'All', label: 'All' },
  { value: 'TOTP & Login credencials', label: 'TOTP & Login credencials' },
  { value: 'Current domain', label: 'Current domain' }
]

export default function UI({}: Props): ReactElement {
  const { setUISettings, UIConfig } = useBackground()
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
              {/* @ts-expect-error */}
              {({ field, form }) => (
                <FormControl
                  isInvalid={form.errors.homeList && form.touched.homeList}
                >
                  <FormLabel htmlFor="homeList">Home list</FormLabel>
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
                    id="homeList"
                    mb={3}
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
