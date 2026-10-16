import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useContext, useEffect, useState } from 'react'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { ClockSkewWarning } from '@src/components/ClockSkewWarning'
import { Button } from '@src/components/ui/button'
import { Home } from '@src/pages/Home'
import { messages } from '@src/locale/en/messages'
import { CLOCK_SKEW_STORAGE_KEY } from '@src/util/clockSkew'
import type { ITOTPSecret } from '@src/util/useDeviceState'
import browser from '../browserMock'
import { DeviceStateContext } from '../deviceStateProvider'
import { PopupPreview } from '../PopupPreview'

const i18n = setupI18n({ locale: 'en', messages: { en: messages } })
const setSample = (offsetMs: number, uncertaintyMs = 500) =>
  browser.storage.session.set({
    [CLOCK_SKEW_STORAGE_KEY]: {
      offsetMs,
      uncertaintyMs,
      checkedAt: Date.now()
    }
  })
const totps: ITOTPSecret[] = [
  {
    id: 'clock-preview-totp',
    kind: EncryptedSecretType.TOTP,
    encrypted: '',
    createdAt: '2026-10-17T10:00:00.000Z',
    totp: {
      label: 'alex@example.com | GitHub',
      secret: 'JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      url: 'https://github.com',
      iconUrl: new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
    }
  }
]

function PopupContents() {
  const defaults = useContext(DeviceStateContext)
  return (
    <DeviceStateContext.Provider
      value={{
        ...defaults,
        currentURL: 'https://github.com/settings/security',
        deviceState: { ...defaults.deviceState, secrets: totps },
        TOTPSecrets: totps,
        searchSecrets: (filter, types = Object.values(EncryptedSecretType)) =>
          totps.filter(
            (item) =>
              types.includes(item.kind) &&
              item.totp.label.toLowerCase().includes(filter.toLowerCase())
          )
      }}
    >
      <ClockSkewWarning />
      <Home />
    </DeviceStateContext.Provider>
  )
}

export function ClockSkewPreview() {
  const [popupOpen, setPopupOpen] = useState(true)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    void setSample(
      Number(params.get('offset') ?? 45_000),
      Number(params.get('uncertainty') ?? 500)
    )
  }, [])
  const [client] = useState(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new ApolloLink(
          () =>
            new Observable((observer) => {
              observer.next({ data: {} })
              observer.complete()
            })
        )
      })
  )

  return (
    <I18nProvider i18n={i18n}>
      <ApolloProvider client={client}>
        <main className="mx-auto grid min-h-screen max-w-4xl items-start gap-8 p-8 md:grid-cols-[1fr_350px]">
          <section className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
              Authier / Clock check
            </p>
            <h1 className="text-3xl font-semibold leading-tight">
              A timely warning for your authenticator codes.
            </h1>
            <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
              The last sync found a device clock difference. The warning remains
              when you reopen the popup and clears after a sync confirms your
              clock is correct.
            </p>
            <div className="grid gap-2">
              <Button variant="outline" onClick={() => setSample(45_000)}>
                Clock 45 seconds ahead
              </Button>
              <Button variant="outline" onClick={() => setSample(-45_000)}>
                Clock 45 seconds behind
              </Button>
              <Button variant="outline" onClick={() => setSample(2000)}>
                Sync after correcting clock
              </Button>
              <Button
                variant="outline"
                onClick={() => setPopupOpen((open) => !open)}
              >
                {popupOpen ? 'Close popup' : 'Open popup'}
              </Button>
            </div>
          </section>
          {popupOpen ? (
            <section className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-xl">
              <PopupPreview>
                <PopupContents />
              </PopupPreview>
            </section>
          ) : null}
        </main>
      </ApolloProvider>
    </I18nProvider>
  )
}
