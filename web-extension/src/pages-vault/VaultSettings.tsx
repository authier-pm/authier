import { Route, Routes, Link as RouterLink, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  FiInfo,
  FiSettings,
  FiShield,
  FiSliders
} from 'react-icons/fi'
import type { IconType } from 'react-icons'
import Security from '@src/components/vault/settings/Security'
import Account from '@src/components/vault/settings/Account'
import { DeviceDefaultsForm } from '@src/components/vault/settings/DeviceDefaultsForm'
import { AboutPage } from './AboutPage'
import { Card, CardContent } from '@src/components/ui/card'
import { cn } from '@src/lib/cn'

interface LinkItemProps {
  description: string
  icon: IconType
  name: string
  path: string
}

const linkItems: LinkItemProps[] = [
  {
    description: 'Email, password, and account ownership controls.',
    icon: FiSettings,
    name: 'Account',
    path: '/account'
  },
  {
    description: 'Device behavior, notifications, and vault protection.',
    icon: FiShield,
    name: 'Security',
    path: '/security'
  },
  {
    description: 'Default policies for devices you add in the future.',
    icon: FiSliders,
    name: 'Defaults',
    path: '/defaults'
  },
  {
    description: 'Version, credits, and product information.',
    icon: FiInfo,
    name: 'About',
    path: '/about'
  }
]

export const VaultSettings = () => {
  const location = useLocation()
  const selectedTab =
    linkItems.find((link) => location.pathname.endsWith(link.path)) ?? linkItems[0]

  return (
    <div className="extension-scrollbar mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 overflow-y-auto p-6 md:p-8">
      <section className="flex flex-col gap-3">
        <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
          Settings
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
          Tune the vault without losing the plot
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)] md:text-base">
          Manage account credentials, security behavior, device defaults, and
          product details from one consistent workspace.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.7fr)]">
        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(16,54,56,0.96)_0%,rgba(17,31,32,1)_75%)]">
          <CardContent className="p-4">
            <div className="mb-4 rounded-[var(--radius-lg)] border border-white/10 bg-black/10 p-4">
              <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
                Selected
              </div>
              <div className="mt-2 text-xl font-semibold text-[color:var(--color-foreground)]">
                {selectedTab.name}
              </div>
              <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                {selectedTab.description}
              </div>
            </div>

            <nav className="space-y-2">
              {linkItems.map((link) => {
                const Icon = link.icon

                return (
                  <RouterLink
                    className={cn(
                      'flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-4 transition',
                      selectedTab.path === link.path
                        ? 'border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/12'
                        : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/5'
                    )}
                    key={link.path}
                    to={`/settings${link.path}`}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border',
                        selectedTab.path === link.path
                          ? 'border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/14 text-[color:var(--color-primary)]'
                          : 'border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-muted)]'
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[color:var(--color-foreground)]">
                        {link.name}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                        {link.description}
                      </div>
                    </div>
                  </RouterLink>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          <Routes key={location.pathname}>
            <Route element={<Account />} path="/account" />
            <Route element={<Security />} path="/security" />
            <Route element={<DeviceDefaultsForm />} path="/defaults" />
            <Route element={<AboutPage />} path="/about" />
          </Routes>
        </AnimatePresence>
      </section>
    </div>
  )
}
