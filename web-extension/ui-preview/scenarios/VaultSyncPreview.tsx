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
import { MemoryRouter } from 'react-router-dom'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { mergeSyncedSecrets } from '@src/background/mergeSyncedSecrets'
import type { SecretSerializedType } from '@src/background/backgroundPage'
import type { SecretTypeUnion } from '@src/background/ExtensionDevice'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { TableList } from '@src/components/vault/TableList'
import { ToastProvider } from '@src/providers/ToastProvider'
import { messages } from '@src/locale/en/messages'
import { DeviceStateContext } from '../deviceStateProvider'
import { device } from '../vaultMocks'

const i18n = setupI18n({ locale: 'en', messages: { en: messages } })
const credentials: SecretTypeUnion[] = ['Duke', 'GitHub'].map((label) => ({
  id: label.toLowerCase(),
  kind: EncryptedSecretType.LOGIN_CREDENTIALS,
  version: 1,
  encrypted: `preview-${label}`,
  createdAt: '2026-10-26T08:00:00.000Z',
  loginCredentials: {
    label,
    username: 'alex@example.com',
    password: 'preview-password',
    url: `https://${label.toLowerCase()}.example.com`,
    iconUrl: new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
  }
}))

function createSyncFixture(onChanged: (items: SecretTypeUnion[]) => void) {
  let cached: SecretSerializedType[] = [...credentials]
  let pendingDeletedSecretIds: string[] = []
  const deletedIds = new Set<string>()
  const notify = () => {
    const cachedIds = new Set(cached.map(({ id }) => id))
    onChanged(credentials.filter(({ id }) => cachedIds.has(id)))
  }
  const removeSecrets = async (ids: string[]) => {
    pendingDeletedSecretIds = [...new Set([...pendingDeletedSecretIds, ...ids])]
    cached = cached.filter(({ id }) => !ids.includes(id))
    notify()
  }
  const backendSync = async () => {
    const snapshot = credentials.map((secret) => ({
      ...secret,
      deletedAt: deletedIds.has(secret.id) ? '2026-10-26T09:00:00.000Z' : null
    }))
    const merged = mergeSyncedSecrets(cached, snapshot, pendingDeletedSecretIds)
    cached = merged.secrets
    pendingDeletedSecretIds = pendingDeletedSecretIds.filter(
      (id) => !merged.confirmedDeletedSecretIds.has(id)
    )
    notify()
    return merged.summary
  }
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const ids = (operation.variables.secrets ?? [
            operation.variables.id
          ]) as string[]
          ids.forEach((id) => deletedIds.add(id))
          observer.next({
            data: {
              me: {
                removeEncryptedSecrets: ids.map((id) => ({ id })),
                encryptedSecret: { id: ids[0], delete: { id: ids[0] } }
              }
            }
          })
          observer.complete()
        })
    )
  })
  return { client, backendSync, removeSecrets }
}

export function VaultSyncPreview() {
  const defaults = useContext(DeviceStateContext)
  const [items, setItems] = useState(credentials)
  const [selectedItems, setSelectedItems] = useState<SecretTypeUnion[]>([])
  const [fixture] = useState(() => createSyncFixture(setItems))

  useEffect(() => {
    const previousSync = device.state.backendSync
    const previousRemove = device.state.removeSecrets
    const previousRemoveSingle = device.state.removeSecret
    device.state.backendSync = fixture.backendSync
    device.state.removeSecrets = fixture.removeSecrets
    device.state.removeSecret = async (id) => fixture.removeSecrets([id])
    return () => {
      device.state.backendSync = previousSync
      device.state.removeSecrets = previousRemove
      device.state.removeSecret = previousRemoveSingle
    }
  }, [fixture])

  return (
    <I18nProvider i18n={i18n}>
      <ApolloProvider client={fixture.client}>
        <MemoryRouter initialEntries={['/credentials']}>
          <ToastProvider>
            <DeviceStateContext.Provider
              value={{
                ...defaults,
                loginCredentials: items,
                selectedItems,
                setSelectedItems,
                searchSecrets: () => items
              }}
            >
              <main
                className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-8"
                data-ui-preview
              >
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
                      Authier
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold">Vault</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[color:var(--color-muted)]">
                      {items.length} {items.length === 1 ? 'secret' : 'secrets'}
                    </span>
                    <RefreshSecretsButton />
                  </div>
                </header>
                <section className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]">
                  <TableList filter="" />
                </section>
              </main>
            </DeviceStateContext.Provider>
          </ToastProvider>
        </MemoryRouter>
      </ApolloProvider>
    </I18nProvider>
  )
}
