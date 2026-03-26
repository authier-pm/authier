import { useDescription, useTsController } from '@ts-react/form'

export default function CheckboxField({ name }: { name: string }) {
  const {
    field: { onChange, value }
  } = useTsController<boolean>()
  const { label } = useDescription()

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[color:var(--color-foreground)]">
      <input
        checked={Boolean(value)}
        className="size-4 rounded border border-[color:var(--color-border)] bg-[color:var(--color-input)]"
        name={name}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}
