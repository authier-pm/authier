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
import { ToastProvider } from './providers/ToastProvider'
import { UserProvider } from './providers/UserProvider'
import { DeviceStateProvider } from './providers/DeviceStateProvider'
import { messages } from './locale/en/messages'

export { toast, useAppToast } from './providers/ToastProvider'

i18n.load('en', messages)
i18n.activate('en')

type ThemeMode = 'light' | 'dark'
const ThemeModeContext = createContext<{
  colorMode: ThemeMode
  toggleColorMode: () => void
}>({
  colorMode: 'dark',
  toggleColorMode: () => {}
})

export const useThemeMode = () => useContext(ThemeModeContext)

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
    setColorMode((currentValue) => (currentValue === 'dark' ? 'light' : 'dark'))
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
