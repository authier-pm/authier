import {
  Button,
  Checkbox,
  CheckboxGroup,
  Collapse,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  useCheckbox,
  useCheckboxGroup,
  Text,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { generate } from 'generate-password'
import { Formik, Form, Field, FormikHelpers } from 'formik'

interface Values {
  numbers: boolean
  symbols: boolean
  uppercase: boolean
  lowercase: boolean
  length: number
}

export const PasswordGenerator = ({ isOpen }: { isOpen: boolean }) => {
  const [generatedPsw, setGeneratedPsw] = useState<string>('')
  const { state, getLabelProps } = useCheckbox()
  const handleChangeGeneratedPassword = (event: any) => {
    setGeneratedPsw(event.target.value)
  }

  return (
    <Collapse in={isOpen} animateOpacity>
      <Flex flexDirection="column" justifyContent="center" alignItems="center">
        <Input
          value={generatedPsw}
          onChange={handleChangeGeneratedPassword}
          placeholder="Generated password"
        />

        <Formik
          initialValues={{
            numbers: false,
            symbols: false,
            uppercase: true,
            lowercase: true,
            length: 8
          }}
          onSubmit={(
            values: Values,
            { setSubmitting }: FormikHelpers<Values>
          ) => {
            console.log(values)
            setGeneratedPsw(generate({ ...values }))
            setSubmitting(false)
          }}
        >
          {(props) => (
            <Form>
              <Flex justifyContent="center" flexDirection="column">
                <HStack>
                  <Field name="numbers">
                    {({ field }) => (
                      <Checkbox id="numbers" name="numbers" {...field}>
                        numbers
                      </Checkbox>
                    )}
                  </Field>
                  <Field name="symbols">
                    {({ field }) => (
                      <Checkbox id="symbols" name="symbols" {...field}>
                        symbols
                      </Checkbox>
                    )}
                  </Field>
                  <Field name="uppercase">
                    {({ field }) => (
                      <Checkbox
                        id="uppercase"
                        name="uppercase"
                        {...field}
                        defaultChecked
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
                        {...field}
                        defaultChecked
                      >
                        lowercase
                      </Checkbox>
                    )}
                  </Field>

                  <Field name="length">
                    {({ field, form }) => (
                      <NumberInput
                        id="length"
                        name="length"
                        size="md"
                        maxW={20}
                        defaultValue={8}
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
                </HStack>

                <Button
                  w={150}
                  alignSelf="center"
                  mt={4}
                  colorScheme="teal"
                  isLoading={props.isSubmitting}
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
