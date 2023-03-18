import { useTsController, useDescription } from '@ts-react/form'
import { CheckIcon, FormControl, Select } from 'native-base'

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
      <FormControl.Label>{label}</FormControl.Label>
      <Select
        onValueChange={(e) => onChange(e)}
        defaultValue={value ? value : ''}
        minWidth="200"
        _selectedItem={{
          bg: 'teal.600',
          endIcon: <CheckIcon size="5" />
        }}
        mt={1}
      >
        {options.map((option) => {
          return (
            <Select.Item label={option} value={option}>
              {option}
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
