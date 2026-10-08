import { webcrypto } from 'node:crypto'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi
} from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { UpdateEncryptedSecretDocument } from '@shared/graphql/EncryptedSecrets.codegen'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { PasskeyData } from '@shared/passkeySchema'
import {
  abToCryptoKey,
  bufferToBase64,
  cryptoKeyToString,
  decryptString,
  encryptString
} from '@shared/cryptoUtils'
import type { SecretSerializedType } from '@src/background/backgroundPage'
import { reencryptVaultSecrets } from '@src/background/reencryptVaultSecrets'
import { PasskeySettings } from './PasskeySettings'

const { state } = vi.hoisted(() => ({
  state: {
    secrets: [] as SecretSerializedType[],
    encrypt: vi.fn<(value: string) => Promise<string>>(),
    decrypt: vi.fn<(value: string) => Promise<string>>(),
    save: vi.fn<() => Promise<void>>()
  }
}))

vi.mock('@src/background/ExtensionDevice', () => ({ device: { state } }))
vi.mock('./DeleteSecretButton', () => ({ DeleteSecretButton: () => null }))

const passkey: PasskeyData = {
  credentialId: 'Y3JlZGVudGlhbA',
  rpId: 'example.com',
  rpName: 'Example',
  userHandle: 'dXNlcg',
  userName: 'alex@example.com',
  userDisplayName: 'Alex',
  privateKeyJwk: {
    kty: 'EC',
    crv: 'P-256',
    x: 'A'.repeat(43),
    y: 'B'.repeat(43),
    d: 'C'.repeat(43)
  },
  createdAt: '2026-09-08T10:00:00.000Z',
  url: 'https://example.com',
  label: 'Example',
  iconUrl: null
}
const salt = new Uint8Array(16).fill(3)
let oldKey: CryptoKey
let newKey: CryptoKey
let persisted: SecretSerializedType[]

beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto)
  oldKey = await abToCryptoKey(new Uint8Array(32).fill(1))
  newKey = await abToCryptoKey(new Uint8Array(32).fill(2))
})
beforeEach(async () => {
  vi.clearAllMocks()
  persisted = []
  state.secrets = [
    {
      id: 'stored-passkey',
      kind: EncryptedSecretType.PASSKEY,
      createdAt: passkey.createdAt,
      version: 9,
      encrypted: await encryptString(oldKey, JSON.stringify(passkey), salt)
    }
  ]
  state.decrypt.mockImplementation((encrypted) =>
    decryptString(oldKey, encrypted)
  )
  state.encrypt.mockImplementation((value) =>
    encryptString(oldKey, value, salt)
  )
  state.save.mockImplementation(async () => {
    persisted = structuredClone(state.secrets)
  })
})
afterEach(cleanup)
afterAll(() => vi.unstubAllGlobals())

function renderEditor(error?: Error) {
  render(
    <MockedProvider
      mocks={[
        {
          request: {
            query: UpdateEncryptedSecretDocument,
            variables: (variables) =>
              variables.id === 'stored-passkey' &&
              variables.patch.kind === EncryptedSecretType.PASSKEY
          },
          result: {
            data: {
              me: {
                encryptedSecret: {
                  id: 'stored-passkey',
                  update: { id: 'stored-passkey', version: 10 }
                }
              }
            }
          },
          error
        }
      ]}
    >
      <PasskeySettings
        secret={{
          ...state.secrets[0],
          kind: EncryptedSecretType.PASSKEY,
          passkey
        }}
      />
    </MockedProvider>
  )
  fireEvent.change(screen.getByRole('textbox', { name: 'Label' }), {
    target: { value: 'Work account' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save label' }))
}

it('uses the saved version for password rotation immediately after editing a passkey label', async () => {
  renderEditor()
  await waitFor(() => expect(state.save).toHaveBeenCalledOnce())
  const patches = await reencryptVaultSecrets(
    persisted,
    await cryptoKeyToString(oldKey),
    newKey,
    bufferToBase64(salt)
  )
  expect(patches[0].expectedVersion).toBe(10)
  expect(JSON.parse(await decryptString(newKey, patches[0].encrypted))).toEqual(
    {
      ...passkey,
      label: 'Work account'
    }
  )
})

it('keeps the previous local version and ciphertext if the label update fails', async () => {
  const original = structuredClone(state.secrets)
  renderEditor(new Error('Could not sync passkey.'))
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain(
      'Could not sync passkey.'
    )
  )
  expect(state.secrets).toEqual(original)
  expect(state.save).not.toHaveBeenCalled()
})
