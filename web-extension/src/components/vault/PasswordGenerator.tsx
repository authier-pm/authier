import React, { useState } from 'react'
import {
  Button,
  Checkbox,
  Collapse,
  Flex,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/react'
import { generate } from 'generate-password'
import { Formik, Form, Field, FormikHelpers } from 'formik'

interface Values {
  numbers: boolean
  symbols: boolean
  uppercase: boolean
  lowercase: boolean
  length: number
}

export const PasswordGenerator = ({
  isOpen,
  setInitPassword
}: {
  isOpen: boolean
  setInitPassword: (password: string) => void
}) => {
  return (
    <Collapse in={isOpen} animateOpacity>
      <Flex
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        m={2}
      >
        <Formik
          initialValues={{
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true,
            length: 14 // TODO make this configurable per user
          }}
          onSubmit={(
            values: Values,
            { setSubmitting }: FormikHelpers<Values>
          ) => {
            setInitPassword(generate({ ...values }))
            setSubmitting(false)
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Flex justifyContent="center" flexDirection="column">
                <HStack>
                  <Field name="length">
                    {({ field, form }) => (
                      <NumberInput
                        id="length"
                        name="length"
                        size="md"
                        maxW={20}
                        value={field.value} // TODO make this configurable per user
                        min={5}
                        onChange={(val) => {
                          form.setFieldValue(field.name, parseInt(val))
                        }}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  </Field>
                  <Field name="numbers">
                    {({ field }) => (
                      <Checkbox
                        id="numbers"
                        name="numbers"
                        isChecked={field.value}
                        {...field}
                      >
                        numbers
                      </Checkbox>
                    )}
                  </Field>
                  <Field name="symbols">
                    {({ field }) => (
                      <Checkbox
                        id="symbols"
                        name="symbols"
                        isChecked={field.value}
                        {...field}
                      >
                        symbols
                      </Checkbox>
                    )}
                  </Field>
                  <Field name="uppercase">
                    {({ field }) => (
                      <Checkbox
                        id="uppercase"
                        name="uppercase"
                        isChecked={field.value}
                        {...field}
                      >
                        uppercase
                      </Checkbox>
                    )}
                  </Field>
                  <Field name="lowercase">
                    {({ field }) => (
                      <Checkbox
                        id="lowercase"
                        name="lowercase"
                        isChecked={field.value}
                        {...field}
                      >
                        lowercase
                      </Checkbox>
                    )}
                  </Field>
                </HStack>

                <Button
                  w={150}
                  alignSelf="center"
                  mt={4}
                  colorScheme="teal"
                  isLoading={isSubmitting}
                  type="submit"
                >
                  Generate
                </Button>
              </Flex>
            </Form>
          )}
        </Formik>
      </Flex>
    </Collapse>
  )
}
