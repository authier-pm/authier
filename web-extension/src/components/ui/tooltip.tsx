import type { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@src/lib/cn'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ children, className, content }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent>
      <TooltipPrimitive.Root>
        <span className="inline-flex">
          <TooltipPrimitive.Trigger asChild>
            {children}
          </TooltipPrimitive.Trigger>
        </span>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={8}
            collisionPadding={8}
            className={cn(
              'z-50 max-w-[calc(100vw-16px)] rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2 py-1 text-xs text-[color:var(--color-foreground)] select-none shadow-lg',
              className
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
