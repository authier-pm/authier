import {
  LockKeyhole,
  LogOut,
  MoonStar,
  Plus,
  ShieldCheck,
  Smartphone,
  SunMedium,
  Vault
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import authierLogo from '@shared/imgs/logo.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVaultSession } from '@/providers/VaultSessionProvider'
import { cn } from '@/lib/cn'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'authier-vault-theme'

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const navigation = [
  { to: '/vault', label: 'Vault', icon: Vault },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/security', label: 'Security', icon: ShieldCheck }
]

export function AppShell({ children }: { children: ReactNode }) {
  const { decryptedSecrets, lockedState, lockVault, logout, session } = useVaultSession()
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme)
  const currentEmail = lockedState?.email ?? session?.user.email ?? 'Signed out'
  const currentDevice = lockedState?.deviceName ?? session?.currentDevice.name ?? 'Unknown device'
  const passwordCount = decryptedSecrets.filter(
    (secret) => secret.kind === 'LOGIN_CREDENTIALS'
  ).length
  const totpCount = decryptedSecrets.filter((secret) => secret.kind === 'TOTP').length

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  return (
    <div className="vault-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:sticky lg:top-6 lg:w-80 lg:shrink-0 xl:w-[22rem]">
          <header className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[0_20px_60px_rgba(17,85,85,0.08)] backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[#2ad5d4] bg-[#2ad5d4] shadow-[0_10px_30px_rgba(17,85,85,0.08)]">
                <img
                  alt="Authier logo"
                  className="h-full w-full object-cover"
                  src={authierLogo}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="inline-flex rounded-full bg-[color:var(--color-primary)] px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-primary-foreground)]">
                  Authier
                </div>
                <div>
                  <Badge>vault.authier.pm</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <p className="text-sm text-[color:var(--color-muted)]">
                  {currentEmail}
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                  Local device
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--color-foreground)]">
                  {currentDevice}
                </p>
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-2">
              {navigation.slice(0, 1).map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-accent)]'
                    )
                  }
                  to={item.to}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-3 ml-4 space-y-3 border-l border-[color:var(--color-border)] pl-4">
              <Button asChild className="w-full justify-start" variant="ghost">
                <Link to="/vault/new">
                  <Plus className="size-4" />
                  Add item
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 transition hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-accent)]"
                  to="/vault/passwords"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                    Passwords
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--color-foreground)]">
                    {passwordCount}
                  </p>
                </Link>
                <Link
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 transition hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-accent)]"
                  to="/vault/totp"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                    TOTP
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--color-foreground)]">
                    {totpCount}
                  </p>
                </Link>
              </div>
            </div>

            <nav className="mt-3 flex flex-col gap-2">
              {navigation.slice(1).map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-accent)]'
                    )
                  }
                  to={item.to}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button
                className="w-full justify-center"
                onClick={() =>
                  setThemeMode((currentTheme) =>
                    currentTheme === 'light' ? 'dark' : 'light'
                  )
                }
                type="button"
                variant="outline"
              >
                {themeMode === 'light' ? (
                  <MoonStar className="size-4" />
                ) : (
                  <SunMedium className="size-4" />
                )}
                {themeMode === 'light' ? 'Dark theme' : 'Light theme'}
              </Button>
              <Button className="w-full justify-center" variant="outline" onClick={lockVault}>
                <LockKeyhole className="size-4" />
                Lock
              </Button>
              <Button className="w-full justify-center" variant="secondary" onClick={() => void logout()}>
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </header>
        </aside>

        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </div>
    </div>
  )
}
