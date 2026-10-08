import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useState } from 'react'
import { defaultMasterDeviceResetConfig } from '@shared/masterDeviceResetConfig'
import { DeviceDefaultsForm } from '@src/components/vault/settings/DeviceDefaultsForm'
import { messages } from '@src/locale/en/messages'

const i18n = setupI18n({ locale: 'en', messages: { en: messages } })
const storageKey = 'preview-default-passkey-verification'

function createPreviewClient() {
  const settings = {
    __typename: 'DefaultDeviceSettingsQuery',
    id: 1,
    autofillTOTPEnabled: true,
    syncTOTP: true,
    vaultLockTimeoutSeconds: 28800,
    theme: 'dark',
    passkeyCreationVerificationRequired:
      localStorage.getItem(storageKey) !== 'false'
  }
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          if (operation.operationName === 'updateDefaultDeviceSettings') {
            const value: unknown =
              operation.variables.config?.passkeyCreationVerificationRequired
            if (typeof value !== 'boolean') {
              observer.error(new Error('Missing passkey creation default'))
              return
            }
            settings.passkeyCreationVerificationRequired = value
            localStorage.setItem(storageKey, String(value))
            observer.next({
              data: {
                me: {
                  __typename: 'UserMutation',
                  defaultDeviceSettings: {
                    __typename: 'DefaultDeviceSettingsMutation',
                    id: settings.id,
                    update: {
                      ...settings,
                      __typename: 'DefaultDeviceSettingsGQLScalars'
                    }
                  }
                }
              }
            })
          } else {
            observer.next({
              data: {
                me: {
                  __typename: 'UserQuery',
                  id: 'preview-user',
                  masterDeviceId: 'another-device',
                  uiLanguage: 'en',
                  deviceRecoveryCooldownMinutes: 2880,
                  masterDeviceResetConfig: defaultMasterDeviceResetConfig,
                  defaultDeviceSettings: { ...settings }
                }
              }
            })
          }
          observer.complete()
        })
    )
  })
}

export function PasskeyDeviceDefaultsPreview() {
  const [client] = useState(createPreviewClient)
  return (
    <I18nProvider i18n={i18n}>
      <ApolloProvider client={client}>
        <main className="mx-auto min-h-screen max-w-3xl p-6 sm:p-10">
          <p className="mb-2 text-sm text-[color:var(--color-muted)]">
            Settings / Defaults
          </p>
          <DeviceDefaultsForm />
        </main>
      </ApolloProvider>
    </I18nProvider>
  )
}
