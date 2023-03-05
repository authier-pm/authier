import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input
} from '@chakra-ui/react'
import { useTsController } from '@ts-react/form'

export function TextField({ label }: { label: string }) {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()

  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>{label}</FormLabel>
      <Input
        onChange={(e) => onChange(e.target.value)}
        value={value ? value : ''}
      />
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
