import { MockedProvider } from '@apollo/client/testing/react'
import type { MockLink } from '@apollo/client/testing'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  RegisterNewUserDocument,
  type RegisterNewUserMutation,
  type RegisterNewUserMutationVariables
} from '@shared/graphql/registerNewUser.codegen'
import { messages } from '@src/locale/en/messages'
import Register from '@src/pages-vault/Register'
import { VaultAuthLayout } from '@src/pages-vault/VaultAuthLayout'

i18n.load('en', messages)
i18n.activate('en')

const registration: MockLink.MockedResponse<
  RegisterNewUserMutation,
  RegisterNewUserMutationVariables
> = {
  request: { query: RegisterNewUserDocument, variables: () => true },
  result: ({ input, userId }) => ({
    data: {
      registerNewUser: {
        accessToken: 'preview-access-token',
        user: {
          id: userId,
          sendEmailVerification: 1,
          Devices: [{ id: String(input.deviceId), name: input.deviceName }],
          notificationOnVaultUnlock: false,
          notificationOnWrongPasswordAttempts: 3
        }
      }
    }
  })
}

export function SignupPreview() {
  return (
    <I18nProvider i18n={i18n}>
      <MockedProvider mocks={[registration]}>
        <MemoryRouter initialEntries={['/signup']}>
          <div id="vault">
            <VaultAuthLayout>
              <Routes>
                <Route path="/signup" element={<Register />} />
                <Route path="/" element={<h1>Your vault</h1>} />
              </Routes>
            </VaultAuthLayout>
          </div>
        </MemoryRouter>
      </MockedProvider>
    </I18nProvider>
  )
}
