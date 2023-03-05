import { useTsController } from '@ts-react/form'
import { Checkbox } from '@chakra-ui/react'

export default function CheckboxField({ name }: { name: string }) {
  const {
    field: { onChange, value }
  } = useTsController<boolean>()

  return (
    <Checkbox
      onChange={(e) => onChange(e.target.checked)}
      checked={value ? value : false}
    >
      {name}
    </Checkbox>
  )
}
