import { Copy, Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useRef,
  useState,
  type Ref,
  type InputHTMLAttributes
} from 'react'
import { copyTextToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  showPasswordCopyButton?: boolean
}

export const inputClassName =
  'h-9 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-foreground)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    disabled,
    showPasswordCopyButton = false,
    type = 'text',
    ...props
  },
  ref
) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordInput = type === 'password'
  const inputRef = useRef<HTMLInputElement | null>(null)

  const assignInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node

    if (typeof ref === 'function') {
      ref(node)
      return
    }

    const mutableRef = ref as Ref<HTMLInputElement> & {
      current?: HTMLInputElement | null
    }

    if (mutableRef && 'current' in mutableRef) {
      mutableRef.current = node
    }
  }

  if (!isPasswordInput) {
    return (
      <input
        className={cn(inputClassName, className)}
        disabled={disabled}
        ref={assignInputRef}
        type={type}
        {...props}
      />
    )
  }

  const handleCopyPassword = () => {
    const passwordValue = inputRef.current?.value

    if (!passwordValue) {
      return
    }

    void copyTextToClipboard(passwordValue)
  }

  return (
    <div className="relative w-full">
      <input
        className={cn(
          inputClassName,
          showPasswordCopyButton ? 'pr-20' : 'pr-10',
          className
        )}
        disabled={disabled}
        ref={assignInputRef}
        type={isPasswordVisible ? 'text' : 'password'}
        {...props}
      />
      {showPasswordCopyButton ? (
        <button
          aria-label="Copy password"
          className="absolute inset-y-0 right-10 flex w-10 items-center justify-center text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)] focus:text-[color:var(--color-foreground)] focus:outline-none"
          disabled={disabled}
          onClick={handleCopyPassword}
          type="button"
        >
          <Copy className="size-4" />
        </button>
      ) : null}
      <button
        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)] focus:text-[color:var(--color-foreground)] focus:outline-none"
        disabled={disabled}
        onClick={() => setIsPasswordVisible((value) => !value)}
        type="button"
      >
        {isPasswordVisible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  )
})
