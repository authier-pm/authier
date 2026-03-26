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

type InputProps = InputHTMLAttributes<HTMLInputElement>

const inputClassName =
  'h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-4 text-sm text-[color:var(--color-foreground)] outline-none ring-0 transition focus:border-[color:var(--color-ring)] focus:shadow-[0_0_0_3px_rgba(42,213,212,0.18)]'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    disabled,
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
        className={cn(inputClassName, 'pr-22', className)}
        disabled={disabled}
        ref={assignInputRef}
        type={isPasswordVisible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label="Copy password"
        className="absolute inset-y-0 right-11 flex w-11 items-center justify-center text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)] focus:text-[color:var(--color-foreground)] focus:outline-none"
        disabled={disabled}
        onClick={handleCopyPassword}
        type="button"
      >
        <Copy className="size-4" />
      </button>
      <button
        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)] focus:text-[color:var(--color-foreground)] focus:outline-none"
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
