import { useContext, useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing/react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { AddSecretInput } from '@src/background/ExtensionDevice'
import { AddItem } from '@src/pages-vault/AddItem'
import SidebarWithHeader from '@src/components/vault/SidebarWithHeader'
import { LimitsDocument } from '@shared/graphql/AccountLimits.codegen'
import { messages } from '@src/locale/en/messages'
import { DeviceStateContext } from '../deviceStateProvider'
import { device } from '../vaultMocks'

i18n.load('en', messages)
i18n.activate('en')

export function AddItemPreview() {
  const defaults = useContext(DeviceStateContext)
  const params = new URLSearchParams(window.location.search)
  const [savedItems, setSavedItems] = useState<AddSecretInput>([])
  const [saveError, setSaveError] = useState(params.has('save-error'))
  const [mocks] = useState(() => [
    {
      request: { query: LimitsDocument },
      result: {
        data: {
          me: {
            id: 'preview-user',
            encryptedSecrets: [],
            loginCredentialsLimit: params.has('login-limit') ? 0 : 100,
            TOTPlimit: params.has('totp-limit') ? 0 : 100
          }
        }
      }
    }
  ])

  // Bridge the production save call to local scenario state without a backend.
  useEffect(() => {
    const original = device.state.addSecrets
    device.state.addSecrets = async (items) => {
      if (saveError)
        throw new Error('Could not save on this device. Please try again.')
      setSavedItems((current) => [...current, ...items])
      return undefined
    }
    return () => {
      device.state.addSecrets = original
    }
  }, [saveError])

  return (
    <I18nProvider i18n={i18n}>
      <MockedProvider mocks={mocks}>
        <DeviceStateContext.Provider
          value={{
            ...defaults,
            deviceState: {
              ...defaults.deviceState,
              syncTOTP: !params.has('logins-only')
            }
          }}
        >
          <MemoryRouter initialEntries={['/', '/addItem']}>
            <SidebarWithHeader>
              <Routes>
                <Route path="/addItem" element={<AddItem />} />
                <Route
                  path="/"
                  element={
                    <div className="mx-auto w-full max-w-3xl space-y-4 p-5">
                      <h1 className="text-2xl font-semibold">Your vault</h1>
                      <p role="status">
                        {savedItems.length}{' '}
                        {savedItems.length === 1 ? 'item' : 'items'} saved
                      </p>
                      <pre
                        className="whitespace-pre-wrap break-all text-sm"
                        data-testid="saved-items"
                      >
                        {JSON.stringify(savedItems)}
                      </pre>
                    </div>
                  }
                />
              </Routes>
            </SidebarWithHeader>
          </MemoryRouter>
        </DeviceStateContext.Provider>
      </MockedProvider>
      {saveError && (
        <button
          className="fixed bottom-2 left-2 rounded-lg bg-warning px-3 py-2 text-sm text-background"
          onClick={() => setSaveError(false)}
          type="button"
        >
          Simulate storage recovery
        </button>
      )}
    </I18nProvider>
  )
}
