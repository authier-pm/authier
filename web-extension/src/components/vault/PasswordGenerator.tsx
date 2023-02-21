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
import { Formik, Field, FormikHelpers } from 'formik'

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
        sx={{
          label: {
            marginBottom: '0px',
            marginTop: '0px'
          }
        }}
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
          {({ isSubmitting, handleSubmit }) => (
            <div>
              <Flex justifyContent="flex-end" flexDirection="column">
                <Flex
                  flexWrap={'wrap'}
                  alignItems="center"
                  alignContent="center"
                  justifyContent={'right'}
                >
                  <Field name="length">
                    {({ field, form }) => (
                      <NumberInput
                        id="length"
                        mr={5}
                        name="length"
                        size="md"
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
                        mr={5}
                        mb={2}
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
                        mr={5}
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
                        mr={5}
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
                        mr={5}
                        {...field}
                      >
                        lowercase
                      </Checkbox>
                    )}
                  </Field>

                  <Button
                    w={150}
                    alignSelf="center"
                    justifySelf={'right'}
                    size={'md'}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    onClick={() => {
                      handleSubmit()
                    }}
                  >
                    Generate
                  </Button>
                </Flex>
              </Flex>
            </div>
          )}
        </Formik>
      </Flex>
    </Collapse>
  )
}
