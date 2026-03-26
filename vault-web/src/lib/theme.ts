export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'authier-vault-theme'

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark'

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (isThemeMode(storedTheme)) {
    return storedTheme
  }

  return 'dark'
}

export const applyTheme = (themeMode: ThemeMode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = themeMode
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }
}

export const initializeTheme = () => {
  applyTheme(getInitialTheme())
}
