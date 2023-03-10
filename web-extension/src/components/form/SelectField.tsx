import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select
} from '@chakra-ui/react'
import { useTsController, useDescription } from '@ts-react/form'

export default function SelectTextField({
  options
}: {
  options: Array<string>
}) {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label } = useDescription()

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        defaultValue={value ? value : ''}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        {options.map((option) => {
          return (
            <option key={option} value={option}>
              {option}
            </option>
          )
        })}
      </Select>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
