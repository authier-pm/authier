import { useEffect, useState } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing/react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import {
  UpdateEncryptedSecretDocument,
  type UpdateEncryptedSecretMutationVariables
} from '@shared/graphql/EncryptedSecrets.codegen'
import { VaultItemSettings } from '@src/components/vault/VaultItemSettings'
import SidebarWithHeader from '@src/components/vault/SidebarWithHeader'
import type { ILoginSecret } from '@src/util/useDeviceState'
import { messages } from '@src/locale/en/messages'
import { device, encodePreviewSecret } from '../vaultMocks'

i18n.load('en', messages)
i18n.activate('en')

export function CredentialEditPreview() {
  const [saved, setSaved] = useState<ILoginSecret['loginCredentials']>()
  const [secret] = useState<ILoginSecret>(() => {
    const loginCredentials = {
      label: '',
      url: 'https://accounts.example.com',
      username: 'alex@example.com',
      password: 'synthetic-preview-password',
      iconUrl: null
    }
    return {
      id: 'preview-credential',
      kind: EncryptedSecretType.LOGIN_CREDENTIALS,
      createdAt: '2026-10-28T08:00:00.000Z',
      encrypted: encodePreviewSecret(JSON.stringify(loginCredentials)),
      loginCredentials
    }
  })
  const [mocks] = useState(() => [
    {
      request: {
        query: UpdateEncryptedSecretDocument,
        variables: (variables: UpdateEncryptedSecretMutationVariables) =>
          variables.id === secret.id
      },
      maxUsageCount: 2,
      result: {
        data: {
          me: {
            encryptedSecret: {
              id: secret.id,
              update: { id: secret.id, version: 2 }
            }
          }
        }
      }
    }
  ])

  // The production route is opened after these local device handlers are ready.
  useEffect(() => {
    const original = {
      secrets: device.state.secrets,
      getSecretDecryptedById: device.state.getSecretDecryptedById,
      save: device.state.save
    }
    const readSecret = async (): Promise<ILoginSecret> => ({
      ...secret,
      loginCredentials: loginCredentialsSchema.parse(
        JSON.parse(await device.state.decrypt(secret.encrypted))
      )
    })
    device.state.secrets = [secret]
    device.state.getSecretDecryptedById = async (id) =>
      id === secret.id ? readSecret() : undefined
    device.state.save = async () => {
      setSaved((await readSecret()).loginCredentials)
    }
    return () => {
      Object.assign(device.state, original)
    }
  }, [secret])

  return (
    <I18nProvider i18n={i18n}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <SidebarWithHeader>
            <Routes>
              <Route
                path="/"
                element={
                  <Link className="text-primary" to={`/secret/${secret.id}`}>
                    Edit credential
                  </Link>
                }
              />
              <Route path="/secret/:secretId" element={<VaultItemSettings />} />
            </Routes>
          </SidebarWithHeader>
        </MemoryRouter>
      </MockedProvider>
      <output className="sr-only" data-testid="saved-credential">
        {saved ? JSON.stringify(saved) : ''}
      </output>
    </I18nProvider>
  )
}
