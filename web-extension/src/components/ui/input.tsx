import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@src/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
