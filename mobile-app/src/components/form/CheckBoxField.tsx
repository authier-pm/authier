import { useTsController } from '@ts-react/form'
import { Checkbox } from 'native-base'

export default function CheckboxField({ name }: { name: string }) {
  const {
    field: { onChange, value }
  } = useTsController<boolean>()

  return (
    <Checkbox
      value={name}
      onChange={(e) => onChange(e)}
      defaultIsChecked={value ? value : false}
    >
      {name}
    </Checkbox>
  )
}
