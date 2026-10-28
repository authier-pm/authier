import { beforeEach, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { DeviceState, device, getDecryptedSecretProp } from './ExtensionDevice'
import { createQueuedSecret } from './createQueuedSecret'
import { pendingSecretRecord } from './pendingSecrets'
import {
  mockPersistentVaultStorage,
  mockVaultLocks
} from '../../tests/vaultStorage'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { passkeySchema } from '@shared/passkeySchema'
import {
  cryptoKeyToString,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import { encode } from 'base64-arraybuffer'

vi.unmock('@src/background/ExtensionDevice')
vi.mock('./createQueuedSecret', () => ({ createQueuedSecret: vi.fn() }))
vi.mock('@src/apollo/apolloClient', () => ({
  apolloClient: { mutate: vi.fn(), query: vi.fn() }
}))
vi.mock('@src/ExtensionProviders', () => ({ toast: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mockPersistentVaultStorage()
  mockVaultLocks()
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  })
  device.state = null
})

it('encrypts passkeys for sync, restores their signing key, and excludes them from password autofill', async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const masterKey = await generateEncryptionKey('my vault password', salt)
  const keys = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  const passkey = passkeySchema.parse({
    credentialId: 'Y3JlZGVudGlhbA',
    rpId: 'example.com',
    rpName: 'Example',
    userHandle: 'dXNlcg',
    userName: 'alex@example.com',
    userDisplayName: 'Alex',
    privateKeyJwk: await crypto.subtle.exportKey('jwk', keys.privateKey),
    createdAt: '2026-09-08T10:00:00.000Z',
    url: 'https://example.com',
    label: 'Example',
    iconUrl: null
  })
  const state = new DeviceState({
    email: 'alex@example.com',
    userId: 'user',
    deviceName: 'test browser',
    encryptionSalt: encode(salt.buffer),
    masterEncryptionKey: await cryptoKeyToString(masterKey),
    authSecret: 'enrollment',
    authSecretEncrypted: 'encrypted-enrollment',
    secrets: [],
    vaultLockTimeoutSeconds: 0,
    syncTOTP: true,
    autofillCredentialsEnabled: true,
    autofillTOTPEnabled: true,
    autofillForbiddenUrlPatterns: '',
    uiLanguage: 'en',
    theme: 'dark',
    notificationOnVaultUnlock: false,
    notificationOnWrongPasswordAttempts: 3
  })
  await state.initialize()
  device.state = state
  await state.save()
  vi.mocked(createQueuedSecret).mockImplementation(async (entry) => {
    expect(entry.operation.kind).toBe(EncryptedSecretType.PASSKEY)
    expect(entry.operation.encrypted).not.toContain(passkey.privateKeyJwk.d)
    expect(entry.operation).not.toHaveProperty('passkey')
    return {
      ...pendingSecretRecord(entry),
      version: 1,
      updatedAt: null,
      deletedAt: null
    }
  })
  const [saved] = await state.addSecrets([
    {
      kind: EncryptedSecretType.PASSKEY,
      passkey,
      createdAt: passkey.createdAt,
      encrypted: ''
    }
  ])
  await state.flushPendingSecrets()
  expect(createQueuedSecret).toHaveBeenCalledTimes(1)
  const restored = await state.getSecretDecryptedById(saved.id)
  expect(restored?.kind).toBe(EncryptedSecretType.PASSKEY)
  if (restored?.kind !== EncryptedSecretType.PASSKEY)
    throw new Error('Missing restored passkey')
  expect(restored.passkey.privateKeyJwk).toEqual(passkey.privateKeyJwk)
  expect(getDecryptedSecretProp(restored, 'password')).toBe('')
  expect(await state.getSecretsDecryptedByTLD('example.com')).toEqual([])
  state.destroy()
  device.state = null
})
