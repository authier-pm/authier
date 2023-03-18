import { useDescription, useTsController } from '@ts-react/form'
import { Checkbox } from '@chakra-ui/react'

export default function CheckboxField({ name }: { name: string }) {
  const {
    field: { onChange, value }
  } = useTsController<boolean>()
  const { label } = useDescription()

  return (
    <Checkbox
      onChange={(e) => onChange(e.target.checked)}
      defaultChecked={value ? value : false}
    >
      {label}
    </Checkbox>
  )
}
