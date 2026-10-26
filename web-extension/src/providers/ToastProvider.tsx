import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react'

type ToastStatus = 'success' | 'error' | 'warning' | 'info'

type ToastOptions = {
  [key: string]: unknown
  title?: string
  description?: string
  status?: ToastStatus
  isClosable?: boolean
}

const ToastContext = createContext<(options: ToastOptions) => void>(() => {})
export const useAppToast = () => useContext(ToastContext)

let imperativeToast: (options: ToastOptions) => void = () => {}

export const toast = (options: ToastOptions) => {
  imperativeToast(options)
}

const toastToneClasses: Record<ToastStatus, string> = {
  error: 'border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)]',
  warning: 'border-amber-400/50 bg-amber-500/10',
  success: 'border-emerald-400/50 bg-emerald-500/10',
  info: 'border-[color:var(--color-border)] bg-[color:var(--color-card)]'
}

type ToastItem = ToastOptions & { id: number }

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const toastItem: ToastItem = {
      id,
      ...options
    }

    setToasts((currentValue) => [...currentValue, toastItem])
    window.setTimeout(() => {
      setToasts((currentValue) => currentValue.filter((item) => item.id !== id))
    }, 3500)
  }, [])

  useEffect(() => {
    imperativeToast = pushToast

    return () => {
      imperativeToast = () => {}
    }
  }, [pushToast])

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[320px] flex-col gap-2">
        {toasts.map((item) => {
          const toneClassName = toastToneClasses[item.status ?? 'info']

          return (
            <div
              className={`pointer-events-auto rounded-[var(--radius-md)] border px-3 py-2 shadow-lg ${toneClassName}`}
              key={item.id}
              role="status"
            >
              {item.title ? (
                <div className="text-sm font-semibold">{item.title}</div>
              ) : null}
              {item.description ? (
                <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                  {item.description}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
