import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select
} from '@chakra-ui/react'
import { useTsController, useDescription } from '@ts-react/form'

type OptionType = {
  value: number
  label: string
}

export default function SelectNumberField({
  options
}: {
  options: OptionType[]
}) {
  const {
    field: { onChange, value },
    error
  } = useTsController<number>()
  const { label } = useDescription()

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        defaultValue={value ? value : ''}
        onChange={(e) => {
          const value = parseInt(e.target.value)
          if (isNaN(value)) onChange(undefined)
          else onChange(value)
        }}
      >
        {options.map((option) => {
          return (
            <option key={option['value']} value={option['value']}>
              {option['label']}
            </option>
          )
        })}
      </Select>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
