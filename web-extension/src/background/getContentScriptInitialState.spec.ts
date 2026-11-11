import { getContentScriptInitialState } from './getContentScriptInitialState'
import {
  capturedInputsByDocument,
  saveLoginModalsStates,
  clearAutofillPageState
} from './autofillPageState'

const { session, device, preference, decrypt } = vi.hoisted(() => {
  const decrypt = vi.fn()
  const session = {
    masterEncryptionKey: 'synthetic-key',
    secrets: [{ kind: 'LOGIN_CREDENTIALS' }],
    decryptedSecrets: [],
    autofillForbiddenUrlPatterns: '',
    getSecretsDecryptedByTLD: decrypt
  }
  const device: {
    state: typeof session | null
    ensureUnlocked: ReturnType<typeof vi.fn>
  } = {
    state: session,
    ensureUnlocked: vi.fn()
  }
  return { session, device, decrypt, preference: vi.fn() }
})
vi.mock('./ExtensionDevice', () => ({ device }))
vi.mock('./getWebInputsForUrl', () => ({ getWebInputsForUrl: () => [] }))
vi.mock('./autofillPagePause', () => ({
  isAutofillPausedForPage: async () => false
}))
vi.mock('@src/util/autofillCredentialsPreference', () => ({
  getAutofillCredentialsEnabled: preference
}))

const login = {
  id: 'synthetic-login',
  kind: 'LOGIN_CREDENTIALS',
  createdAt: '2026-11-11T00:00:00Z',
  loginCredentials: {
    username: 'test@example.com',
    password: 'synthetic-password',
    url: 'https://example.com',
    label: 'Example'
  }
}

beforeEach(() => {
  device.state = session
  session.masterEncryptionKey = 'synthetic-key'
  device.ensureUnlocked.mockImplementation(async () => Boolean(device.state))
  decrypt.mockResolvedValue([login])
  preference.mockResolvedValue(true)
  clearAutofillPageState()
})

it('returns credentials only for an unlocked, enabled session', async () => {
  expect(
    (await getContentScriptInitialState('https://example.com', 9))
      .secretsForHost.loginCredentials
  ).toEqual([login])
  preference.mockResolvedValue(false)
  expect(
    (await getContentScriptInitialState('https://example.com', 9))
      .secretsForHost.loginCredentials
  ).toEqual([])
})

it('discards decryption that finishes after a lock', async () => {
  decrypt.mockImplementation(async () => {
    device.state = null
    return [login]
  })
  const state = await getContentScriptInitialState('https://example.com', 9)
  expect(state.extensionDeviceReady).toBe(false)
  expect(state.secretsForHost.loginCredentials).toEqual([])
})

it('discards credentials if the account changes during the storage read', async () => {
  preference.mockImplementation(async () => {
    device.state = { ...session }
    return true
  })
  expect(
    (await getContentScriptInitialState('https://example.com', 9))
      .secretsForHost.loginCredentials
  ).toEqual([])
})

it('scopes saved forms to their requesting document and clears all transient state', async () => {
  saveLoginModalsStates.set('9:document-one', {
    username: 'one',
    password: 'synthetic-one'
  })
  capturedInputsByDocument.set('9:document-one', [])
  expect(
    (
      await getContentScriptInitialState(
        'https://example.com',
        9,
        '9:document-two'
      )
    ).saveLoginModalsState
  ).toBeUndefined()
  clearAutofillPageState()
  expect(saveLoginModalsStates.size).toBe(0)
  expect(capturedInputsByDocument.size).toBe(0)
})
