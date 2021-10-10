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
  Text
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { generate } from 'generate-password'
import { Formik, Form, Field, FormikHelpers } from 'formik'

interface Values {
  numbers: false
}

export const PasswordGenerator = ({ isOpen }: { isOpen: boolean }) => {
  const [generatedPsw, setGeneratedPsw] = useState<string>('')
  const [symbols, setSymbols] = useState(false)
  const [uppercase, setUppercase] = useState(false)
  const [lowercase, setLowercase] = useState(false)
  const [numbers, setNumbers] = useState(false)
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

        <HStack>
          <Checkbox name="symbols">symbols</Checkbox>
          <Checkbox name="uppercase">uppercase</Checkbox>
          <Checkbox name="lowercase">lowercase</Checkbox>
          <Checkbox name="numbers">numbers</Checkbox>
        </HStack>
        <Formik
          initialValues={{ numbers: false }}
          onSubmit={(
            values: Values,
            { setSubmitting }: FormikHelpers<Values>
          ) => {
            setTimeout(() => {
              alert(JSON.stringify(values, null, 2))
              setSubmitting(false)
            }, 500)
          }}
        >
          {(props) => (
            <Form>
              <Field name="numbers">
                {({ field }) => (
                  <Checkbox id="numbers" name="numbers" {...field}>
                    <Text fontSize="sm" textAlign="left">
                      I agree to the Terms and Conditions.
                    </Text>
                  </Checkbox>
                )}
              </Field>
              <Button
                mt={4}
                colorScheme="teal"
                isLoading={props.isSubmitting}
                type="submit"
                onClick={() => console.log(props)}
              >
                Submit
              </Button>
            </Form>
          )}
        </Formik>

        <Button
          colorScheme="blackAlpha"
          size="sm"
          onClick={() => {
            setGeneratedPsw(generate({ length: 10, numbers: true }))
            console.log(getLabelProps())
          }}
        >
          generate
        </Button>
      </Flex>
    </Collapse>
  )
}
