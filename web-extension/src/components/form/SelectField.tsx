import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select
} from '@chakra-ui/react'
import { useTsController } from '@ts-react/form'

export default function SelectField({
  label,
  options
}: {
  label: string
  options: Array<Array<string | number>> | Array<string>
}) {
  const { field, error } = useTsController<string>()

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        value={field.value ? field.value : 'none'}
        onChange={(e) => {
          field.onChange(e.target.value)
        }}
      >
        {!field.value && <option value="none">Please select...</option>}
        {options.map((option) => {
          return (
            <option
              key={option[0]}
              value={options.length > 2 ? option[1] : option}
            >
              {options.length > 2 ? option[0] : option}
            </option>
          )
        })}
      </Select>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
