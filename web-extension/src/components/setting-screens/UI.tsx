import {
  FormControl,
  FormLabel,
  Select,
  FormErrorMessage,
  Checkbox,
  Button
} from '@chakra-ui/react'
import { useBackground } from '@src/util/useBackground'
import { Formik, FormikHelpers, Form, Field } from 'formik'
import React, { ReactElement } from 'react'

interface Props {}

export interface UISettings {
  homeList: 'All' | 'TOTP' | 'Login credencials' | 'Current domain'
}

export default function UI({}: Props): ReactElement {
  const { setUISettings } = useBackground()
  return (
    <>
      <Formik
        initialValues={{
          homeList: 'All'
        }}
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
                  <Select {...field} id="homeList" mb={3}>
                    <option>All</option>
                    <option>TOTP</option>
                    <option>Login credencials</option>
                    <option>Current domain</option>
                  </Select>
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
