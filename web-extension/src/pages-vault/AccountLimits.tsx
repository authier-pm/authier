import { useState, type ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { FaCheck } from 'react-icons/fa'
import {
  FiArrowUpRight,
  FiCreditCard,
  FiKey,
  FiLock,
  FiShield
} from 'react-icons/fi'
import { MD5 } from 'crypto-js'
import browser from 'webextension-polyfill'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { device } from '@src/background/ExtensionDevice'
import { RefreshAccountLimits } from '@src/components/vault/RefreshAccountLimits'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'
import { getTokenFromLocalStorage } from '@src/util/accessTokenExtension'

const page_url = process.env.PAGE_URL as string

type PlanCardProps = {
  cta: ReactNode
  description: string
  features: string[]
  icon: ReactNode
  name: string
  popular?: boolean
  price: string
}

export const AccountLimits = () => {
  const { data } = useLimitsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const [refreshAccountTooltip, setRefreshAccountTooltip] = useState(false)

  const email = device.state?.email ?? ''
  const secrets = data?.me.encryptedSecrets ?? []
  const credentialCount = secrets.filter(
    (secret) => secret.kind === 'LOGIN_CREDENTIALS'
  ).length
  const totpCount = secrets.filter((secret) => secret.kind === 'TOTP').length

  const openPricing = async (portal = false) => {
    const token = await getTokenFromLocalStorage()
    await browser.tabs.create({
      url: `${page_url}/pricing?${portal ? 'portal=true&' : ''}acToken=${token}`
    })
    setRefreshAccountTooltip(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 md:p-8">
      <section className="flex flex-col gap-3">
        <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
          <Trans>Account Limits</Trans>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
          Scale your vault without losing clarity
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)] md:text-base">
          Review your current usage, refresh synced limits, and add capacity only
          where you need it.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(16,54,56,0.96)_0%,rgba(17,31,32,1)_75%)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  alt={email}
                  className="size-16 rounded-2xl border border-white/10 bg-[color:var(--color-card)] object-cover shadow-lg"
                  src={`https://www.gravatar.com/avatar/${MD5(email).toString()}?d=identicon`}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
                    Vault account
                  </div>
                  <div className="mt-1 truncate text-lg font-semibold text-[color:var(--color-foreground)]">
                    {email || 'Unknown account'}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                    Limits are synced per account and applied across devices.
                  </div>
                </div>
              </div>
              <RefreshAccountLimits
                refreshAccountTooltip={refreshAccountTooltip}
                setRefreshAccountTooltip={setRefreshAccountTooltip}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <UsageChip
                icon={<FiLock className="size-4" />}
                label="Credential usage"
                value={`${credentialCount} / ${data?.me.loginCredentialsLimit ?? 0}`}
              />
              <UsageChip
                icon={<FiKey className="size-4" />}
                label="TOTP usage"
                value={`${totpCount} / ${data?.me.TOTPlimit ?? 0}`}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="min-w-[12rem]"
                onClick={async () => {
                  await openPricing(true)
                }}
              >
                <FiCreditCard className="size-4" />
                Subscriptions
              </Button>
              <Button
                className="min-w-[12rem]"
                onClick={async () => {
                  await openPricing()
                }}
                variant="outline"
              >
                <FiArrowUpRight className="size-4" />
                Open pricing
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--color-card)]/90">
          <CardHeader>
            <CardTitle>Current allowance</CardTitle>
            <CardDescription>
              Your vault usage and included capacity at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <StatPanel
              accent="from-cyan-400/30 to-transparent"
              count={credentialCount}
              icon={<FiLock className="size-5" />}
              limit={data?.me.loginCredentialsLimit ?? 0}
              name="Credentials"
            />
            <StatPanel
              accent="from-emerald-400/30 to-transparent"
              count={totpCount}
              icon={<FiKey className="size-5" />}
              limit={data?.me.TOTPlimit ?? 0}
              name="TOTPs"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Upgrade options
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Mix and match plans depending on whether you need more passwords,
              TOTPs, or both.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
          <PlanCard
            cta={
              <div className="rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
                Always free
              </div>
            }
            description="Perfect for trying the vault and keeping a compact set of essentials."
            features={['3 TOTP secrets', '40 login secrets']}
            icon={<FiShield className="size-5" />}
            name="Free tier"
            price="0"
          />

          <PlanCard
            cta={
              <BuyButton
                disabled={!data?.me.id}
                onClick={async () => {
                  await openPricing()
                }}
              />
            }
            description="Add more room for passwords without changing your TOTP allowance."
            features={['Additional 250 login secrets']}
            icon={<FiLock className="size-5" />}
            name="Credentials"
            price="1"
          />

          <PlanCard
            cta={
              <BuyButton
                disabled={!data?.me.id}
                onClick={async () => {
                  await openPricing()
                }}
              />
            }
            description="Expand one-time password storage for teams and heavy 2FA usage."
            features={['Additional 100 TOTP secrets']}
            icon={<FiKey className="size-5" />}
            name="TOTP"
            price="1"
          />

          <PlanCard
            cta={
              <BuyButton
                disabled={!data?.me.id}
                onClick={async () => {
                  await openPricing()
                }}
              />
            }
            description="Best value if you want both password and TOTP capacity together."
            features={['Additional 250 login secrets', 'Additional 100 TOTP secrets']}
            icon={<FiCreditCard className="size-5" />}
            name="TOTP and Credentials"
            popular
            price="2"
          />
        </div>
      </section>
    </div>
  )
}

function UsageChip({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-[color:var(--color-muted)] uppercase">
        <span className="text-[color:var(--color-primary)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-[color:var(--color-foreground)]">
        {value}
      </div>
    </div>
  )
}

function StatPanel({
  accent,
  count,
  icon,
  limit,
  name
}: {
  accent: string
  count: number
  icon: ReactNode
  limit: number
  name: string
}) {
  const usageRatio = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--color-muted)] uppercase">
              {name}
            </div>
            <div className="mt-2 text-3xl font-semibold">{count}</div>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-primary)]">
            {icon}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm text-[color:var(--color-muted)]">
            <span>Included limit</span>
            <span>{limit}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-[color:var(--color-primary)]"
              style={{ width: `${usageRatio}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-[color:var(--color-muted)]">
            {usageRatio}% used
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  cta,
  description,
  features,
  icon,
  name,
  popular,
  price
}: PlanCardProps) {
  return (
    <Card
      className={
        popular
          ? 'relative overflow-hidden border-[color:var(--color-primary)]/40 bg-[linear-gradient(180deg,rgba(18,44,46,0.98)_0%,rgba(14,26,27,1)_100%)]'
          : 'relative overflow-hidden'
      }
    >
      {popular ? (
        <div className="absolute right-4 top-4 rounded-full border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/15 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[color:var(--color-primary)] uppercase">
          Most popular
        </div>
      ) : null}

      <CardHeader className="pb-4">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-surface-muted)] text-[color:var(--color-primary)]">
          {icon}
        </div>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-6">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold text-[color:var(--color-muted)]">$</span>
          <span className="text-5xl font-semibold leading-none">{price}</span>
          <span className="pb-1 text-sm text-[color:var(--color-muted)]">/month</span>
        </div>

        <ul className="space-y-3 text-sm text-[color:var(--color-foreground)]">
          {features.map((feature) => (
            <li className="flex items-start gap-3" key={feature}>
              <FaCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">{cta}</div>
      </CardContent>
    </Card>
  )
}

function BuyButton({
  disabled,
  onClick
}: {
  disabled: boolean
  onClick: () => Promise<void>
}) {
  return (
    <Button
      className="w-full"
      disabled={disabled}
      onClick={async () => {
        await onClick()
      }}
      variant="primary"
    >
      Buy
    </Button>
  )
}
