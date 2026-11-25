import { MockedProvider } from '@apollo/client/testing/react'
import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useContext } from 'react'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { messages } from '@src/locale/en/messages'
import { Home } from '@src/pages/Home'
import type { ILoginSecret } from '@src/util/useDeviceState'
import { DeviceStateContext } from '../deviceStateProvider'
import { PopupPreview } from '../PopupPreview'

const i18n = setupI18n({ locale: 'en', messages: { en: messages } })
const iconUrl = new URL('../fixtures/exampleFavicon.svg', import.meta.url).href
const logins: ILoginSecret[] = [
  {
    id: 'checking',
    label: 'Example Bank',
    username: 'alex@example.com',
    password: 'V7!sp9#Qct2@x'
  },
  {
    id: 'savings',
    label: 'Example Bank Savings',
    username: 'savings@example.com',
    password: 'H4-b6%fR'
  }
].map(({ id, ...loginCredentials }) => ({
  id,
  kind: EncryptedSecretType.LOGIN_CREDENTIALS,
  encrypted: '',
  createdAt: '2026-11-25T09:00:00.000Z',
  loginCredentials: { ...loginCredentials, iconUrl, url: 'https://example.com' }
}))

function PopupContents() {
  const defaults = useContext(DeviceStateContext)
  const context = {
    ...defaults,
    deviceState: { ...defaults.deviceState, secrets: logins },
    loginCredentials: logins,
    searchSecrets: (search: string) =>
      logins.filter(({ loginCredentials }) =>
        loginCredentials.label.toLowerCase().includes(search.toLowerCase())
      )
  }

  return (
    <DeviceStateContext.Provider value={context}>
      <Home />
    </DeviceStateContext.Provider>
  )
}

export function PasswordPositionsPreview() {
  return (
    <I18nProvider i18n={i18n}>
      <MockedProvider>
        <PopupPreview>
          <PopupContents />
        </PopupPreview>
      </MockedProvider>
    </I18nProvider>
  )
}
