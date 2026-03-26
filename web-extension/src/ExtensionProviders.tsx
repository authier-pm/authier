import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react'
import { UserProvider } from './providers/UserProvider'
import { DeviceStateProvider } from './providers/DeviceStateProvider'
import { messages } from './locale/en/messages'

i18n.load('en', messages)
i18n.activate('en')

type ThemeMode = 'light' | 'dark'
type ToastStatus = 'success' | 'error' | 'warning' | 'info'

type ToastOptions = {
  [key: string]: unknown
  title?: string
  description?: string
  status?: ToastStatus
  isClosable?: boolean
}

const ThemeModeContext = createContext<{
  colorMode: ThemeMode
  toggleColorMode: () => void
}>({
  colorMode: 'dark',
  toggleColorMode: () => {}
})

const ToastContext = createContext<(options: ToastOptions) => void>(() => {})

let imperativeToast: (options: ToastOptions) => void = () => {}

export const toast = (options: ToastOptions) => {
  imperativeToast(options)
}

export const useThemeMode = () => useContext(ThemeModeContext)
export const useAppToast = () => useContext(ToastContext)

function ThemeModeProvider({ children }: PropsWithChildren) {
  const [colorMode, setColorMode] = useState<ThemeMode>(() => {
    const rootTheme =
      typeof document === 'undefined'
        ? null
        : (document.documentElement.dataset.theme as ThemeMode | undefined)

    return rootTheme ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode
  }, [colorMode])

  const toggleColorMode = useCallback(() => {
    setColorMode((currentValue) =>
      currentValue === 'dark' ? 'light' : 'dark'
    )
  }, [])

  const value = useMemo(
    () => ({
      colorMode,
      toggleColorMode
    }),
    [colorMode, toggleColorMode]
  )

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  )
}

type ToastItem = ToastOptions & { id: number }

function ToastProvider({ children }: PropsWithChildren) {
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
          const toneClassName =
            item.status === 'error'
              ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)]'
              : item.status === 'warning'
                ? 'border-amber-400/50 bg-amber-500/10'
                : item.status === 'success'
                  ? 'border-emerald-400/50 bg-emerald-500/10'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-card)]'

          return (
            <div
              className={`pointer-events-auto rounded-[var(--radius-md)] border px-3 py-2 shadow-lg ${toneClassName}`}
              key={item.id}
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

export function ExtensionProviders({ children }: PropsWithChildren) {
  return (
    <I18nProvider i18n={i18n}>
      <ThemeModeProvider>
        <ToastProvider>
          <DeviceStateProvider>
            <UserProvider>{children}</UserProvider>
          </DeviceStateProvider>
        </ToastProvider>
      </ThemeModeProvider>
    </I18nProvider>
  )
}
