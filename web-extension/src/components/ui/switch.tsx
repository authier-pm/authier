import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@src/lib/cn'

type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Switch({
  checked,
  className,
  onCheckedChange,
  ...props
}: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]',
        checked ? 'bg-[color:var(--color-primary)]' : 'bg-[color:var(--color-border)]',
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
      {...props}
    >
      <span
        className={cn(
          'block size-5 rounded-full bg-white shadow transition',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
