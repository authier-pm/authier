import { Route, Routes, Link as RouterLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Security from '@src/components/vault/settings/Security'
import Account from '@src/components/vault/settings/Account'
import { DeviceDefaultsForm } from '@src/components/vault/settings/DeviceDefaultsForm'
import { AboutPage } from './AboutPage'
import { cn } from '@src/lib/cn'

interface LinkItemProps {
  name: string
  path: string
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'Account', path: '/account' },
  { name: 'Security', path: '/security' },
  { name: 'Defaults', path: '/defaults' },
  { name: 'About', path: '/about' }
]

export const VaultSettings = () => {
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState(LinkItems[0])

  useEffect(() => {
    const currentTab = LinkItems.find((link) =>
      location.pathname.endsWith(link.path)
    )

    if (currentTab) {
      setSelectedTab(currentTab)
    }
  }, [location.pathname])

  return (
    <div className="mb-10 flex flex-col items-center justify-center">
      <div className="w-full bg-[color:var(--color-secondary)] p-3">
        <nav className="flex justify-center gap-4">
          {LinkItems.map((link) => {
            return (
              <RouterLink
                className={cn(
                  'rounded-[var(--radius-md)] px-2 py-1 text-xl transition',
                  selectedTab.name === link.name
                    ? 'bg-[color:var(--color-surface-muted)]'
                    : 'bg-transparent'
                )}
                key={link.name}
                onClick={() => {
                  setSelectedTab(link)
                }}
                to={`/settings${link.path}`}
              >
                {link.name}
              </RouterLink>
            )
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <Routes key={location.pathname}>
          <Route element={<Account />} path="/account" />
          <Route element={<Security />} path="/security" />
          <Route element={<DeviceDefaultsForm />} path="/defaults" />
          <Route element={<AboutPage />} path="/about" />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
