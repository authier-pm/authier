import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react'
import { useTsController, useDescription } from '@ts-react/form'

export function NumberField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<number>()
  const { label } = useDescription()

  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>{label}</FormLabel>
      <NumberInput
        min={0}
        max={50}
        defaultValue={value}
        onChange={(valueString, valueNumber) => onChange(valueNumber)}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
