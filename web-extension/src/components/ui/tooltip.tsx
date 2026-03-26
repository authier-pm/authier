import type { ReactNode } from 'react'
import { cn } from '@src/lib/cn'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ children, className, content }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2 py-1 text-xs text-[color:var(--color-foreground)] shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block',
          className
        )}
      >
        {content}
      </span>
    </span>
  )
}
