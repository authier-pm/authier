import { beforeEach, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import {
  readLockedVaultSnapshot,
  saveLockedVaultSnapshot
} from './lockedVaultStorage'

const snapshot = {
  email: 'test@example.com',
  userId: 'user',
  secrets: [],
  encryptionSalt: 'salt',
  deviceName: 'browser',
  authSecretEncrypted: 'ciphertext',
  vaultLockTimeoutSeconds: 3600,
  autofillCredentialsEnabled: true,
  autofillTOTPEnabled: true,
  autofillForbiddenUrlPatterns: '',
  uiLanguage: 'en',
  syncTOTP: true,
  theme: 'dark',
  notificationOnVaultUnlock: false,
  notificationOnWrongPasswordAttempts: 3
}

beforeEach(() => vi.clearAllMocks())

it('stores only encrypted secrets and unlock metadata, stripping key and plaintext caches', async () => {
  await saveLockedVaultSnapshot({
    ...snapshot,
    masterEncryptionKey: 'raw-key',
    authSecret: 'plaintext-enrollment',
    decryptedSecrets: [{ password: 'password' }]
  })
  expect(browser.storage.local.set).toHaveBeenCalledWith({
    lockedState: snapshot
  })
})

it('restores a locked vault after restart and sanitizes legacy unlocked snapshots', async () => {
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    backgroundState: {
      ...snapshot,
      masterEncryptionKey: 'raw-key',
      authSecret: 'plaintext-enrollment'
    }
  })
  expect(await readLockedVaultSnapshot()).toEqual(snapshot)
  expect(browser.storage.local.remove).toHaveBeenCalledWith(
    expect.arrayContaining(['backgroundState', 'access-token'])
  )
  expect(browser.storage.local.set).toHaveBeenCalledWith({
    lockedState: snapshot
  })
})

it('does not restore malformed snapshots or tokens', async () => {
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    lockedState: { masterEncryptionKey: 'key' },
    'access-token': 'jwt'
  })
  expect(await readLockedVaultSnapshot()).toBeNull()
  expect(browser.storage.local.remove).toHaveBeenCalledWith('lockedState')
})

it('persists passkey ciphertext across restart without leaking the signing key', async () => {
  const passkeyRecord = {
    id: 'passkey',
    kind: 'PASSKEY',
    encrypted: 'encrypted-signing-key',
    version: 8,
    createdAt: '2026-09-08T10:00:00.000Z'
  }
  await saveLockedVaultSnapshot({
    ...snapshot,
    secrets: [
      { ...passkeyRecord, passkey: { privateKeyJwk: { d: 'private-key' } } }
    ],
    decryptedSecrets: [
      { ...passkeyRecord, passkey: { privateKeyJwk: { d: 'private-key' } } }
    ]
  })
  const encryptedSnapshot = { ...snapshot, secrets: [passkeyRecord] }
  expect(browser.storage.local.set).toHaveBeenCalledWith({
    lockedState: encryptedSnapshot
  })
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    lockedState: encryptedSnapshot
  })
  expect(await readLockedVaultSnapshot()).toEqual(encryptedSnapshot)
})

it('preserves record versions through locking so password rotation can detect stale ciphertext', async () => {
  const versionedSnapshot = {
    ...snapshot,
    secrets: [
      {
        id: 'secret',
        encrypted: 'ciphertext',
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        version: 7,
        createdAt: '2026-09-08T12:00:00.000Z'
      }
    ]
  }
  await saveLockedVaultSnapshot(versionedSnapshot)
  expect(browser.storage.local.set).toHaveBeenCalledWith({
    lockedState: versionedSnapshot
  })
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    lockedState: versionedSnapshot
  })
  expect(await readLockedVaultSnapshot()).toEqual(versionedSnapshot)
})
