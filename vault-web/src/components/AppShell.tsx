import {
  type LucideIcon,
  KeyRound,
  LockKeyhole,
  LogOut,
  Menu,
  MoonStar,
  ShieldCheck,
  Smartphone,
  SunMedium,
  Vault
} from 'lucide-react'
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react'
import { NavLink } from 'react-router-dom'
import authierLogo from '@shared/imgs/logo.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { applyTheme, getInitialTheme, type ThemeMode } from '@/lib/theme'
import { useVaultSession } from '@/providers/VaultSessionProvider'

type LinkItem = {
  icon: LucideIcon
  label: string
  path: string
}

const primaryNavigation: LinkItem[] = [
  { icon: Vault, label: 'Vault', path: '/vault' },
  { icon: LockKeyhole, label: 'Passwords', path: '/vault/passwords' },
  { icon: KeyRound, label: 'TOTP', path: '/vault/totp' }
]

const workspaceNavigation: LinkItem[] = [
  { icon: Smartphone, label: 'Devices', path: '/devices' },
  { icon: ShieldCheck, label: 'Security', path: '/security' }
]

const getAccountInitial = (email: string) =>
  email.slice(0, 1).toUpperCase() || 'A'

function LogoMark() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-card)] shadow-lg">
      <img alt="Authier logo" className="h-full w-full object-cover" src={authierLogo} />
    </div>
  )
}

function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 text-[11px] font-medium tracking-[0.24em] text-[color:var(--color-muted)] uppercase">
      {children}
    </div>
  )
}

function NavItem({
  item,
  onNavigate
}: {
  item: LinkItem
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium transition',
          isActive
            ? 'bg-[color:var(--color-accent)] text-[color:var(--color-foreground)]'
            : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent)]/60 hover:text-[color:var(--color-foreground)]'
        )
      }
      onClick={onNavigate}
      to={item.path}
    >
      <Icon className="size-5 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function SidebarContent({
  currentDevice,
  currentEmail,
  onNavigate,
  passwordCount,
  setThemeMode,
  themeMode,
  totpCount
}: {
  currentDevice: string
  currentEmail: string
  onNavigate: () => void
  passwordCount: number
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>
  themeMode: ThemeMode
  totpCount: number
}) {
  const { lockVault, logout } = useVaultSession()

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center gap-3 px-2">
        <LogoMark />
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] uppercase">
            Authier
          </div>
          <div className="text-xs text-[color:var(--color-muted)]">
            vault.authier.pm
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SidebarSectionLabel>Vault</SidebarSectionLabel>
        {primaryNavigation.map((item) => (
          <NavItem item={item} key={item.path} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <SidebarSectionLabel>Workspace</SidebarSectionLabel>
        {workspaceNavigation.map((item) => (
          <NavItem item={item} key={item.path} onNavigate={onNavigate} />
        ))}
      </div>

      <Card className="mt-auto border-white/10 bg-[color:var(--color-surface-muted)] p-4 backdrop-blur-[14px]">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm font-semibold uppercase">
            {getAccountInitial(currentEmail)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{currentEmail}</div>
            <div className="truncate text-xs text-[color:var(--color-muted)]">
              {currentDevice}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="border-white/10 bg-[color:var(--color-card)] px-2.5 py-1 text-[11px] text-[color:var(--color-muted)]">
            {passwordCount} passwords
          </Badge>
          <Badge className="border-white/10 bg-[color:var(--color-card)] px-2.5 py-1 text-[11px] text-[color:var(--color-muted)]">
            {totpCount} TOTP
          </Badge>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              onNavigate()
              lockVault()
            }}
            size="sm"
            variant="outline"
          >
            <LockKeyhole className="size-4" />
            Lock
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onNavigate()
              void logout()
            }}
            size="sm"
            variant="destructive"
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>

        <Button
          className="mt-2 w-full justify-start"
          onClick={() =>
            setThemeMode((currentTheme) =>
              currentTheme === 'light' ? 'dark' : 'light'
            )
          }
          size="sm"
          variant="ghost"
        >
          {themeMode === 'light' ? (
            <MoonStar className="size-4" />
          ) : (
            <SunMedium className="size-4" />
          )}
          {themeMode === 'light' ? 'Dark theme' : 'Light theme'}
        </Button>
      </Card>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { decryptedSecrets, lockedState, session } = useVaultSession()
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const currentEmail = lockedState?.email ?? session?.user.email ?? 'Signed out'
  const currentDevice =
    lockedState?.deviceName ?? session?.currentDevice.name ?? 'Unknown device'
  const passwordCount = decryptedSecrets.filter(
    (secret) => secret.kind === 'LOGIN_CREDENTIALS'
  ).length
  const totpCount = decryptedSecrets.filter((secret) => secret.kind === 'TOTP').length

  useEffect(() => {
    applyTheme(themeMode)
  }, [themeMode])

  return (
    <div className="min-h-screen text-[color:var(--color-foreground)] lg:h-screen lg:overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-[14px] lg:block">
        <SidebarContent
          currentDevice={currentDevice}
          currentEmail={currentEmail}
          onNavigate={() => {}}
          passwordCount={passwordCount}
          setThemeMode={setThemeMode}
          themeMode={themeMode}
          totpCount={totpCount}
        />
      </aside>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileSidebarOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(85vw,20rem)] flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-[14px]">
            <SidebarContent
              currentDevice={currentDevice}
              currentEmail={currentEmail}
              onNavigate={() => setIsMobileSidebarOpen(false)}
              passwordCount={passwordCount}
              setThemeMode={setThemeMode}
              themeMode={themeMode}
              totpCount={totpCount}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col lg:h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-[14px] lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Button
              aria-label="Open navigation"
              onClick={() => setIsMobileSidebarOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div className="text-sm font-semibold tracking-[0.18em] uppercase">
                Authier
              </div>
            </div>
            <div className="size-10" />
          </div>
        </header>

        <main className="vault-grid flex flex-1 flex-col px-4 py-4 lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-6">
          <div className="flex flex-1 flex-col lg:min-h-0">{children}</div>
        </main>
      </div>
    </div>
  )
}
