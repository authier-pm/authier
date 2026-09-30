import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useContext, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { VaultList } from '@src/pages-vault/VaultList'
import SidebarWithHeader from '@src/components/vault/SidebarWithHeader'
import type { SecretTypeUnion } from '@src/background/ExtensionDevice'
import {
  DeviceStateContext,
  ScreenshotDeviceStateProvider
} from '../deviceStateProvider'
import { messages } from '@src/locale/en/messages'

i18n.load('en', messages)
i18n.activate('en')

const credentials: SecretTypeUnion[] = Array.from(
  { length: 662 },
  (_, index) => ({
    id: `preview-credential-${index}`,
    kind: EncryptedSecretType.LOGIN_CREDENTIALS,
    createdAt: '2026-09-30T08:00:00.000Z',
    encrypted: '',
    loginCredentials: {
      label: `Saved account ${String(index + 1).padStart(3, '0')}`,
      username: 'alex@example.com',
      password: 'preview-password',
      url: `https://account-${index + 1}.example.com`,
      iconUrl: new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
    }
  })
)

function VaultScenario() {
  const defaults = useContext(DeviceStateContext)
  const [loaded, setLoaded] = useState(false)
  const [selectedItems, setSelectedItems] = useState<SecretTypeUnion[]>([])
  const params = new URLSearchParams(location.search)
  const items = loaded ? credentials : []
  const context = {
    ...defaults,
    loginCredentials: items,
    selectedItems,
    setSelectedItems,
    setSecuritySettings: async () => undefined,
    searchSecrets: (filter: string) =>
      items.filter(
        (item) =>
          item.kind === EncryptedSecretType.LOGIN_CREDENTIALS &&
          item.loginCredentials.label
            .toLowerCase()
            .includes(filter.toLowerCase())
      )
  }
  const [client] = useState(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new ApolloLink(
          () =>
            new Observable((observer) => {
              observer.next({
                data: {
                  me: {
                    id: 'preview-user',
                    ...defaults.deviceState,
                    loginCredentialsLimit: 1000,
                    TOTPlimit: 1000
                  },
                  currentDevice: {
                    id: 'preview-device',
                    ...defaults.deviceState
                  }
                }
              })
              observer.complete()
            })
        )
      })
  )

  return (
    <ApolloProvider client={client}>
      <DeviceStateContext.Provider value={context}>
        <SidebarWithHeader>
          <VaultList tableView={params.get('view') !== 'cards'} />
        </SidebarWithHeader>
        {!loaded && (
          <button
            className="fixed bottom-8 right-8 rounded-xl bg-[color:var(--color-primary)] px-4 py-3 text-[color:var(--color-primary-foreground)]"
            onClick={() => setLoaded(true)}
          >
            Load saved items
          </button>
        )}
      </DeviceStateContext.Provider>
    </ApolloProvider>
  )
}

export function VaultScrollingPreview() {
  return (
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/credentials']}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ScreenshotDeviceStateProvider>
            <VaultScenario />
          </ScreenshotDeviceStateProvider>
        </QueryParamProvider>
      </MemoryRouter>
    </I18nProvider>
  )
}
