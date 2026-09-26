import { webcrypto } from 'node:crypto'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  bufferToBase64,
  cryptoKeyToString,
  encryptString,
  generateEncryptionKey
} from '@shared/cryptoUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { device, deviceInitialization, DeviceState } from './ExtensionDevice'
import { loginSessionManager } from './loginSession'
import { useDeviceState } from '@src/util/useDeviceState'
import type { IBackgroundStateSerializable } from './backgroundPage'

const { loginMutation, query, mutate } = vi.hoisted(() => ({
  loginMutation: vi.fn(),
  query: vi.fn(),
  mutate: vi.fn()
}))
vi.unmock('@src/background/ExtensionDevice')
vi.mock('@src/apollo/apolloClient', () => ({
  apolloClient: { query, mutate },
  apolloClientWithoutTokenRefresh: { mutate: loginMutation }
}))
vi.mock('@src/ExtensionProviders', () => ({ toast: vi.fn() }))

const password = 'test-master-password'
let snapshot: IBackgroundStateSerializable
let enrollmentCiphertext: string
let sessionStorage: Record<string, unknown>
let listeners: Set<Parameters<typeof browser.storage.onChanged.addListener>[0]>

beforeAll(async () => {
  await deviceInitialization
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  })
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await generateEncryptionKey(password, salt)
  enrollmentCiphertext = await encryptString(key, 'enrollment-secret', salt)
  snapshot = {
    email: 'person@example.com',
    userId: 'user-id',
    deviceName: 'Test browser',
    encryptionSalt: bufferToBase64(salt),
    masterEncryptionKey: await cryptoKeyToString(key),
    authSecret: 'enrollment-secret',
    authSecretEncrypted: enrollmentCiphertext,
    secrets: [
      {
        id: 'saved-password',
        encrypted: await encryptString(
          key,
          JSON.stringify({
            username: 'person@example.com',
            password: 'saved-password-value',
            url: 'https://example.com',
            label: 'Example',
            iconUrl: null
          }),
          salt
        ),
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        createdAt: '2026-09-26T00:00:00.000Z',
        version: 1
      }
    ],
    vaultLockTimeoutSeconds: 0,
    syncTOTP: true,
    autofillCredentialsEnabled: true,
    autofillTOTPEnabled: true,
    autofillForbiddenUrlPatterns: '',
    uiLanguage: 'en',
    theme: 'dark',
    notificationOnVaultUnlock: false,
    notificationOnWrongPasswordAttempts: 3
  }
})

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage = {}
  listeners = new Set()
  vi.mocked(browser.storage.onChanged.addListener).mockImplementation(
    (listener) => {
      listeners.add(listener)
    }
  )
  vi.mocked(browser.storage.onChanged.removeListener).mockImplementation(
    (listener) => {
      listeners.delete(listener)
    }
  )
  vi.mocked(browser.storage.session.get).mockImplementation(
    async () => sessionStorage
  )
  vi.mocked(browser.storage.session.set).mockImplementation(async (values) => {
    Object.assign(sessionStorage, values)
    const changes = Object.fromEntries(
      Object.entries(values).map(([name, newValue]) => [name, { newValue }])
    )
    for (const listener of [...listeners]) listener(changes, 'session')
  })
  device.state = null
  device.lockedState = null
  await loginSessionManager.resetLogin()
  const token = `e30.${btoa(JSON.stringify({ userId: snapshot.userId }))}.signature`
  loginMutation.mockReset()
  loginMutation
    .mockResolvedValueOnce({
      data: {
        deviceDecryptionChallenge: {
          __typename: 'DecryptionChallengeApproved',
          id: 42,
          addDeviceSecretEncrypted: enrollmentCiphertext,
          encryptionSalt: snapshot.encryptionSalt,
          userId: snapshot.userId,
          approvedAt: '2026-09-26T00:00:00.000Z'
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        deviceDecryptionChallenge: {
          __typename: 'DecryptionChallengeApproved',
          addNewDeviceForUser: {
            accessToken: token,
            user: {
              ...snapshot,
              EncryptedSecrets: [],
              device: snapshot,
              defaultDeviceSettings: { theme: 'dark' }
            }
          }
        }
      }
    })
  query.mockReset()
  query
    .mockResolvedValueOnce({
      data: { currentDevice: { encryptedSecretsToSync: snapshot.secrets } }
    })
    .mockResolvedValueOnce({ data: { webInputs: [] } })
  mutate.mockResolvedValue({ data: {} })
})

afterEach(() => {
  cleanup()
  device.state?.destroy()
  device.state = null
  loginSessionManager.dispose()
  vi.restoreAllMocks()
})

it('syncs a freshly installed device and populates the open popup without manual refresh', async () => {
  const { result } = renderHook(useDeviceState)
  expect(result.current.deviceState).toBeNull()
  await act(async () => {
    await loginSessionManager.startLogin({ email: snapshot.email, password })
  })
  await waitFor(() => expect(result.current.loginCredentials).toHaveLength(1))
  expect(result.current.loginCredentials[0].loginCredentials.password).toBe(
    'saved-password-value'
  )
  expect(device.state?.secrets).toEqual(snapshot.secrets)
  expect(query).toHaveBeenCalledTimes(2)
  expect(mutate).toHaveBeenCalledTimes(1)
  expect(sessionStorage.backgroundState).toMatchObject({ decryptedSecrets: [] })
  expect(JSON.stringify(sessionStorage)).not.toContain('saved-password-value')
})

it('hydrates ciphertext received after login even without another backend request', async () => {
  const { result } = renderHook(useDeviceState)
  await act(async () => {
    await browser.storage.session.set({
      backgroundState: { ...snapshot, decryptedSecrets: [] },
      lockedState: null
    })
  })
  await waitFor(() => expect(result.current.loginCredentials).toHaveLength(1))
  expect(query).not.toHaveBeenCalled()
})

it('finishes initialization when restored storage arrives before the initialization callback', async () => {
  let finishInitialization!: () => void
  vi.spyOn(device, 'onInitDone').mockImplementation((callback) => {
    finishInitialization = callback
  })
  device.isInitialized = false
  const { result } = renderHook(useDeviceState)
  await act(async () => {
    await browser.storage.session.set({
      backgroundState: snapshot,
      lockedState: null
    })
    device.isInitialized = true
    finishInitialization()
  })
  await waitFor(() => expect(result.current.loginCredentials).toHaveLength(1))
  expect(result.current.isInitialized).toBe(true)
})

it('does not display a late decrypted snapshot after the vault is locked', async () => {
  const { result } = renderHook(useDeviceState)
  let finishDecryption!: () => void
  const pending = new Promise<void>((resolve) => {
    finishDecryption = resolve
  })
  const initialize = DeviceState.prototype.initialize
  const initializeSpy = vi
    .spyOn(DeviceState.prototype, 'initialize')
    .mockImplementation(async function (this: DeviceState) {
      await pending
      await initialize.call(this)
    })
  await act(async () => {
    await browser.storage.session.set({ backgroundState: snapshot })
    await browser.storage.session.set({
      backgroundState: null,
      lockedState: snapshot
    })
    finishDecryption()
    await initializeSpy.mock.results[0].value
  })
  expect(result.current.deviceState).toBeNull()
  expect(result.current.loginCredentials).toEqual([])
})

it('keeps a successful login when the initial synchronization is offline', async () => {
  const failure = new Error('Offline')
  query.mockReset().mockRejectedValueOnce(failure)
  const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
  await loginSessionManager.startLogin({ email: snapshot.email, password })
  expect(device.state?.email).toBe(snapshot.email)
  expect(await loginSessionManager.getSnapshot()).toMatchObject({
    status: 'editing',
    error: null,
    password: ''
  })
  expect(logError).toHaveBeenCalledWith(
    'Failed to synchronize the vault after login',
    failure
  )
})
