import { type JSX, type ReactNode, useState } from 'react'
import { NavLink as RouterLink } from 'react-router-dom'
import MD5 from 'crypto-js/md5'
import browser from 'webextension-polyfill'
import { Trans } from '@lingui/react/macro'
import { FiClock, FiHardDrive, FiHome, FiKey, FiLock, FiMenu, FiRepeat, FiSettings, FiStar } from 'react-icons/fi'
import { TbLogout } from 'react-icons/tb'
import type { IconType } from 'react-icons'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { Card } from '@src/components/ui/card'
import { cn } from '@src/lib/cn'
import { useThemeMode } from '@src/ExtensionProviders'

interface LinkItemProps {
  title: JSX.Element
  icon: IconType
  path: string
  exact?: boolean
}

const primaryLinks: LinkItemProps[] = [
  {
    title: <Trans>Vault</Trans>,
    icon: FiHome,
    path: '/',
    exact: true
  },
  {
    title: <Trans>Credentials</Trans>,
    icon: FiLock,
    path: '/credentials'
  },
  {
    title: <Trans>TOTPs</Trans>,
    icon: FiKey,
    path: '/totps'
  }
]

const secondaryLinks: LinkItemProps[] = [
  {
    title: <Trans>Settings</Trans>,
    icon: FiSettings,
    path: '/settings/account'
  },
  {
    title: <Trans>Account Limits</Trans>,
    icon: FiStar,
    path: '/account-limits'
  },
  {
    title: <Trans>Devices</Trans>,
    icon: FiHardDrive,
    path: '/devices'
  },
  {
    title: <Trans>Import & Export</Trans>,
    icon: FiRepeat,
    path: '/import-export'
  },
  {
    title: <Trans>Password generation history</Trans>,
    icon: FiClock,
    path: '/password-generation-history'
  }
]

export default function SidebarWithHeader({
  children
}: {
  children: ReactNode
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen text-[color:var(--color-foreground)] lg:h-screen lg:overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[color:var(--color-border)] extension-surface lg:block">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileSidebarOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(85vw,20rem)] flex-col border-r border-[color:var(--color-border)] extension-surface">
            <SidebarContent
              onNavigate={() => {
                setIsMobileSidebarOpen(false)
              }}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col lg:h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] extension-surface lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Button
              aria-label="Open navigation"
              onClick={() => setIsMobileSidebarOpen(true)}
              size="icon"
              variant="ghost"
            >
              <FiMenu className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="text-sm font-semibold tracking-[0.18em] uppercase">
                Authier
              </span>
            </div>
            <div className="size-10" />
          </div>
        </header>
        <main className="flex flex-1 flex-col px-4 py-4 lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const email = device.state?.email
  const { colorMode, toggleColorMode } = useThemeMode()

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-[color:var(--color-muted)]">
        Loading vault...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center gap-3 px-2">
        <LogoMark />
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] uppercase">
            Authier
          </div>
          <div className="text-xs text-[color:var(--color-muted)]">
            Secure vault
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SidebarSectionLabel>
          <Trans>Vault</Trans>
        </SidebarSectionLabel>
        {primaryLinks.map((item) => (
          <NavItem item={item} key={item.path} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <SidebarSectionLabel>
          <Trans>Workspace</Trans>
        </SidebarSectionLabel>
        {secondaryLinks.map((item) => (
          <NavItem item={item} key={item.path} onNavigate={onNavigate} />
        ))}
      </div>

      <Card className="mt-auto border-white/10 bg-[color:var(--color-surface-muted)] p-4">
        <div className="flex items-center gap-3">
          <img
            alt={email}
            className="size-11 rounded-full border border-[color:var(--color-border)] object-cover"
            src={`https://www.gravatar.com/avatar/${MD5(email).toString()}`}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{email}</div>
            <div className="text-xs text-[color:var(--color-muted)]">
              <Trans>Vault unlocked</Trans>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            onClick={async () => {
              onNavigate()
              await device.lock()
            }}
            size="sm"
            variant="outline"
          >
            <FiLock className="size-4" />
            <Trans>Lock</Trans>
          </Button>
          <Button
            className="flex-1"
            onClick={async () => {
              onNavigate()
              await device.logout()
            }}
            size="sm"
            variant="destructive"
          >
            <TbLogout className="size-4" />
            <Trans>Logout</Trans>
          </Button>
        </div>

        <Button
          className="mt-2 w-full justify-start"
          onClick={toggleColorMode}
          size="sm"
          variant="ghost"
        >
          <FiSettings className="size-4" />
          {colorMode === 'dark' ? 'Light theme' : 'Dark theme'}
        </Button>
      </Card>
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
  item: LinkItemProps
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <RouterLink
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium transition',
          isActive
            ? 'bg-[color:var(--color-accent)] text-[color:var(--color-foreground)]'
            : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent)]/60 hover:text-[color:var(--color-foreground)]'
        )
      }
      end={item.exact}
      onClick={onNavigate}
      to={item.path}
    >
      <Icon className="size-5 shrink-0" />
      <span>{item.title}</span>
    </RouterLink>
  )
}

function LogoMark() {
  return (
    <div
      className="size-10 rounded-2xl border border-white/10 bg-cover bg-center shadow-lg"
      style={{
        backgroundImage: `url('${browser.runtime.getURL('icon-128.png')}')`
      }}
    />
  )
}
