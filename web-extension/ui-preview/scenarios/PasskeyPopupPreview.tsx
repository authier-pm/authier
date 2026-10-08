import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useContext, useState } from 'react'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { IPasskeySecret } from '@src/util/useDeviceState'
import {
  getDecryptedSecretProp,
  type SecretTypeUnion
} from '@src/background/ExtensionDevice'
import { Home } from '@src/pages/Home'
import { messages } from '@src/locale/en/messages'
import { DeviceStateContext } from '../deviceStateProvider'
import { PopupPreview } from '../PopupPreview'

const i18n = setupI18n({ locale: 'en', messages: { en: messages } })
const iconUrl = new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
const createdAt = '2026-10-08T10:00:00.000Z'
const passkey = (
  id: string,
  label: string,
  rpId: string,
  userName: string
): IPasskeySecret => ({
  id,
  kind: EncryptedSecretType.PASSKEY,
  encrypted: '',
  createdAt,
  passkey: {
    credentialId: id,
    rpId,
    rpName: label,
    userHandle: 'cHJldmlldw',
    userName,
    userDisplayName: 'Alex Morgan',
    privateKeyJwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'A'.repeat(43),
      y: 'A'.repeat(43),
      d: 'A'.repeat(43)
    },
    createdAt,
    url: `https://${rpId}`,
    label,
    iconUrl
  }
})
const passkeys = [
  passkey('github-passkey', 'GitHub', 'github.com', 'alex@example.com'),
  passkey(
    'github-work-passkey',
    'GitHub work',
    'github.com',
    'alex@work.example'
  ),
  passkey('other-passkey', 'Example Cloud', 'example.net', 'alex@cloud.example')
]
const credentials: SecretTypeUnion[] = [
  ...passkeys,
  {
    id: 'github-password',
    kind: EncryptedSecretType.LOGIN_CREDENTIALS,
    encrypted: '',
    createdAt,
    loginCredentials: {
      label: 'GitHub password',
      username: 'alex@example.com',
      password: 'preview-password',
      url: 'https://github.com',
      iconUrl
    }
  },
  {
    id: 'github-totp',
    kind: EncryptedSecretType.TOTP,
    encrypted: '',
    createdAt,
    totp: {
      label: 'GitHub 2FA',
      secret: 'JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      url: 'https://github.com',
      iconUrl
    }
  }
]

function PopupContents() {
  const defaults = useContext(DeviceStateContext)
  const params = new URLSearchParams(location.search)
  const items = params.has('passkeysOnly') ? passkeys : credentials
  const context = {
    ...defaults,
    currentURL: params.get('site') ?? 'https://github.com/settings/security',
    deviceState: { ...defaults.deviceState, secrets: items },
    TOTPSecrets: items.filter((item) => item.kind === EncryptedSecretType.TOTP),
    loginCredentials: items.filter(
      (item) => item.kind === EncryptedSecretType.LOGIN_CREDENTIALS
    ),
    passkeys,
    searchSecrets: (
      filter: string,
      types = Object.values(EncryptedSecretType)
    ) =>
      items.filter(
        (item) =>
          types.includes(item.kind) &&
          ['label', 'username', 'url'].some((property) =>
            getDecryptedSecretProp(
              item,
              property as 'label' | 'username' | 'url'
            )
              .toLowerCase()
              .includes(filter.toLowerCase())
          )
      )
  }
  return (
    <DeviceStateContext.Provider value={context}>
      <Home />
    </DeviceStateContext.Provider>
  )
}

export function PasskeyPopupPreview() {
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
        <PopupPreview>
          <PopupContents />
        </PopupPreview>
      </ApolloProvider>
    </I18nProvider>
  )
}
