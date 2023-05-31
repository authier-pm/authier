import { act } from '@testing-library/react-native'
import { useDeviceStateStore } from './deviceStateStore'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { AddSecretInput } from './deviceStore'

// Secrets to be added
const secrets: AddSecretInput[] = [
  {
    kind: EncryptedSecretType.LOGIN_CREDENTIALS,
    loginCredentials: {
      password: 'test',
      username: 'test',
      url: 'test',
      label: 'test',
      iconUrl: null
    },
    encrypted: 'test',
    createdAt: new Date().toJSON()
  }
]

describe('useTestStore', () => {
  it.todo('test')
  // it('adds and encrypts secrets, then stores them in state', async () => {
  //   //Use `act` when updating state to ensure all updates are applied
  //   //before the assertions are run.
  //   console.log('test')
  //   await act(async () => {
  //     //@ts-expect-error
  //     await useDeviceStateStore.getState().addSecrets(secrets)
  //   })

  //   //Check if the secrets were added and encrypted correctly
  //   for (let secret of secrets) {
  //     expect(useDeviceStateStore.getState().secrets).toContainEqual(
  //       expect.objectContaining({
  //         kind: secret.kind,
  //         encrypted: expect.any(String) //We just check that it's a string, adjust if necessary
  //       })
  //     )
  //   }

  //   //Check if the secrets were decrypted and added to decryptedSecrets correctly
  //   for (let secret of secrets) {
  //     expect(useDeviceStateStore.getState().decryptedSecrets).toContainEqual(
  //       expect.objectContaining({
  //         kind: secret.kind
  //         //Add any extra properties you expect here
  //       })
  //     )
  //   }
  // })
})
