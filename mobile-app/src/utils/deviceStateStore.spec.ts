import { renderHook, act } from '@testing-library/react-native'
import { useTestStore } from './deviceStateStore'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'

// Secrets to be added
const secrets = [
  {
    id: 'test_id',
    kind: EncryptedSecretType.TOTP,
    encrypted: 'test_encrypted',
    totp: {
      digits: 6,
      iconUrl: 'https://example.com',
      label: 'test_label',
      period: 30,
      secret: 'test_secret',
      url: 'https://example.com'
    }
  },
  {
    id: 'test_id',
    encrypted: 'test_encrypted',
    kind: EncryptedSecretType.LOGIN_CREDENTIALS,
    loginCredentials: {
      iconUrl: 'https://example.com',
      label: 'test_label',
      url: 'https://example.com',
      username: 'test_username',
      password: 'test_password'
    }
  }
]

describe('useTestStore', () => {
  it('adds and encrypts secrets, then stores them in state', async () => {
    // Use `act` when updating state to ensure all updates are applied
    // before the assertions are run.
    await act(async () => {
      //@ts-ignore
      await useTestStore.getState().addSecrets(secrets)
    })

    // Check if the secrets were added and encrypted correctly
    for (let secret of secrets) {
      expect(useTestStore.getState().secrets).toContainEqual(
        expect.objectContaining({
          kind: secret.kind,
          encrypted: expect.any(String) // We just check that it's a string, adjust if necessary
        })
      )
    }

    // Check if the secrets were decrypted and added to decryptedSecrets correctly
    for (let secret of secrets) {
      expect(useTestStore.getState().decryptedSecrets).toContainEqual(
        expect.objectContaining({
          kind: secret.kind
          // Add any extra properties you expect here
        })
      )
    }
  })
})
