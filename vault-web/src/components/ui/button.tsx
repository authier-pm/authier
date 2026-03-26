import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[0_16px_40px_rgba(25,128,127,0.18)] hover:brightness-105',
        secondary:
          'border-[color:var(--color-secondary)] bg-[color:var(--color-secondary)] text-white hover:bg-[#0f4b4b]',
        outline:
          'border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-accent)]',
        ghost:
          'border-transparent bg-transparent text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]'
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
