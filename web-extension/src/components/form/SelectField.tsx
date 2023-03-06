import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select
} from '@chakra-ui/react'
import { useTsController, useDescription } from '@ts-react/form'

export default function SelectField({
  options
}: {
  options: Array<Array<string | number>> | Array<string>
}) {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()
  console.log(value)
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        value={value ? value : ''}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        {!value && <option value="">Please select...</option>}
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
