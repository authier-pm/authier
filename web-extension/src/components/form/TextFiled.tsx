import { FormControl, FormErrorMessage, Input } from '@chakra-ui/react'
import { useTsController } from '@ts-react/form'

export function TextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()

  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <Input
        onChange={(e) => onChange(e.target.value)}
        value={value ? value : ''}
      />
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
