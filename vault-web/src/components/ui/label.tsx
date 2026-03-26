import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium text-[color:var(--color-foreground)]',
        className
      )}
      {...props}
    />
  )
}
