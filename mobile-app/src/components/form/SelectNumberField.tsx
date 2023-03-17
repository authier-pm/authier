/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable @typescript-eslint/no-shadow */
import { CheckIcon, FormControl, Select } from 'native-base'
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
      <FormControl.Label>{label}</FormControl.Label>
      <Select
        defaultValue={value ? value.toString() : ''}
        _selectedItem={{
          bg: 'teal.600',
          endIcon: <CheckIcon size="5" />
        }}
        mt={1}
        onValueChange={(e) => {
          const value = parseInt(e)
          if (isNaN(value)) onChange(undefined)
          else onChange(value)
        }}
      >
        {options.map((option) => {
          return (
            <Select.Item
              label={option['value'].toString()}
              value={option['value'].toString()}
            >
              {option['label']}
            </Select.Item>
          )
        })}
      </Select>
      {error && (
        <FormControl.ErrorMessage>
          {error.errorMessage}
        </FormControl.ErrorMessage>
      )}
    </FormControl>
  )
}
