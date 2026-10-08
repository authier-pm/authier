import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useContext, useEffect, useState } from 'react'
import { Link, MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { IPasskeySecret } from '@src/util/useDeviceState'
import { PasskeySettings } from '@src/components/vault/PasskeySettings'
import { TableList } from '@src/components/vault/TableList'
import SidebarWithHeader from '@src/components/vault/SidebarWithHeader'
import { messages } from '@src/locale/en/messages'
import { DeviceStateContext } from '../deviceStateProvider'
import {
  device,
  encodePreviewSecret,
  decodePreviewPasskey
} from '../vaultMocks'

i18n.load('en', messages)
i18n.activate('en')

const passkeys: IPasskeySecret[] = ['GitHub', 'Google'].map((site, index) => {
  const rpId = index === 0 ? 'github.com' : 'accounts.google.com'
  const passkey: IPasskeySecret['passkey'] = {
    credentialId: `preview${index}`,
    rpId,
    rpName: site,
    userHandle: 'YWxleA',
    userName: 'alex@example.com',
    userDisplayName: 'Alex Morgan',
    privateKeyJwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'A'.repeat(43),
      y: 'B'.repeat(43),
      d: 'C'.repeat(43)
    },
    createdAt: '2026-09-08T10:00:00.000Z',
    url: `https://${rpId}`,
    label: `alex@example.com | ${site}`,
    iconUrl: new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
  }
  return {
    id: `preview-passkey-${index}`,
    kind: EncryptedSecretType.PASSKEY,
    createdAt: passkey.createdAt,
    // The preview uses synthetic data and a reversible mock of vault encryption.
    encrypted: encodePreviewSecret(JSON.stringify(passkey)),
    passkey
  }
})

function PasskeyPreviewDetail({ items }: { items: IPasskeySecret[] }) {
  const { secretId } = useParams()
  const secret = items.find(({ id }) => id === secretId)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        className="text-sm text-[color:var(--color-primary)]"
        to="/passkeys"
      >
        ← Back to passkeys
      </Link>
      {secret && <PasskeySettings key={secret.id} secret={secret} />}
    </div>
  )
}

export function PasskeySidebarPreview() {
  return (
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/passkeys']}>
        <SidebarWithHeader>
          <h1 className="text-2xl font-semibold">Passkeys</h1>
        </SidebarWithHeader>
      </MemoryRouter>
    </I18nProvider>
  )
}

export function PasskeyVaultPreview() {
  const defaults = useContext(DeviceStateContext)
  const [items, setItems] = useState(passkeys)
  const [selectedItems, setSelectedItems] = useState(defaults.selectedItems)
  const [client] = useState(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new ApolloLink(
          (operation) =>
            new Observable((observer) => {
              if (new URLSearchParams(location.search).has('failSave')) {
                observer.error(
                  new Error('Could not sync passkey. Please try again.')
                )
                return
              }
              const original = passkeys.find(
                ({ id }) => id === operation.variables.id
              )
              const updated = decodePreviewPasskey(
                operation.variables.patch.encrypted
              )
              // Only the label may change; the account and cryptographic material must survive.
              if (
                !original ||
                JSON.stringify({
                  ...updated,
                  label: original.passkey.label
                }) !== JSON.stringify(original.passkey)
              ) {
                observer.error(new Error('Passkey data changed unexpectedly.'))
                return
              }
              observer.next({
                data: {
                  me: {
                    id: 'preview-user',
                    encryptedSecret: {
                      id: original.id,
                      update: { id: original.id }
                    }
                  }
                }
              })
              observer.complete()
            })
        )
      })
  )

  useEffect(() => {
    device.state.secrets = passkeys.map(({ passkey: _passkey, ...secret }) => ({
      ...secret
    }))
    device.state.save = async () => {
      setItems(
        await Promise.all(
          device.state.secrets.map((secret) =>
            device.state.decryptSecret(secret)
          )
        )
      )
    }
  }, [])

  return (
    <I18nProvider i18n={i18n}>
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/passkeys']}>
          <DeviceStateContext.Provider
            value={{
              ...defaults,
              passkeys: items,
              selectedItems,
              setSelectedItems,
              searchSecrets: (filter) =>
                items.filter(({ passkey }) =>
                  passkey.label.toLowerCase().includes(filter.toLowerCase())
                )
            }}
          >
            <main
              className="flex min-h-screen flex-col gap-6 p-8"
              data-ui-preview
            >
              <h1 className="text-sm font-semibold tracking-widest text-[color:var(--color-primary)] uppercase">
                Authier / Your passkeys
              </h1>
              <Routes>
                <Route
                  path="/passkeys"
                  element={
                    <div className="flex h-[430px] flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)]">
                      <TableList filter="" />
                    </div>
                  }
                />
                <Route
                  path="/secret/:secretId"
                  element={<PasskeyPreviewDetail items={items} />}
                />
              </Routes>
            </main>
          </DeviceStateContext.Provider>
        </MemoryRouter>
      </ApolloProvider>
    </I18nProvider>
  )
}
