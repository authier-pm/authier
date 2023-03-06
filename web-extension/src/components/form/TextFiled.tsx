import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input
} from '@chakra-ui/react'
import { useTsController, useDescription } from '@ts-react/form'

export function TextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()

  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>{label}</FormLabel>
      <Input
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        value={value ? value : ''}
      />
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
