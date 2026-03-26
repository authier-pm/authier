import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[color:var(--color-muted)]',
        className
      )}
      {...props}
    />
  )
}
