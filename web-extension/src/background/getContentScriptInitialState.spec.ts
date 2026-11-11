import browser from 'webextension-polyfill'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { matchesCredentialHost } from '@shared/urlUtils'
import type { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { getAutofillSender } from './autofillSender'
import { getContentScriptInitialState } from './getContentScriptInitialState'
import {
  capturedInputsByDocument,
  saveLoginModalsStates,
  clearAutofillPageState
} from './autofillPageState'

const { session, device, preference, decrypt } = vi.hoisted(() => {
  const decrypt = vi.fn()
  const decryptedSecrets: (ILoginSecret | ITOTPSecret)[] = []
  const session = {
    masterEncryptionKey: 'synthetic-key',
    secrets: [{ kind: 'LOGIN_CREDENTIALS' }],
    decryptedSecrets,
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
  session.decryptedSecrets = []
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

const loginFor = (
  url: string,
  username = 'test@example.com'
): ILoginSecret => ({
  id: `login ${username} ${url}`,
  kind: EncryptedSecretType.LOGIN_CREDENTIALS,
  encrypted: 'synthetic-ciphertext',
  createdAt: '2026-11-11T00:00:00Z',
  loginCredentials: {
    label: url,
    username,
    password: `password for ${url}`,
    url,
    iconUrl: null
  }
})

const totpFor = (url: string | null): ITOTPSecret => ({
  id: `totp ${url}`,
  kind: EncryptedSecretType.TOTP,
  encrypted: 'synthetic-ciphertext',
  createdAt: '2026-11-11T00:00:00Z',
  totp: {
    label: 'Authenticator',
    secret: 'JBSWY3DPEHPK3PXP',
    digits: 6,
    period: 30,
    url,
    iconUrl: null
  }
})

/** Matches hosts the way the vault does, so only the scheme rule is under test. */
const useVault = (secrets: (ILoginSecret | ITOTPSecret)[]) => {
  session.decryptedSecrets = secrets
  decrypt.mockImplementation(async (host: string) =>
    secrets.filter((secret) =>
      matchesCredentialHost(
        host,
        secret.kind === EncryptedSecretType.TOTP
          ? (secret.totp.url ?? '')
          : secret.loginCredentials.url
      )
    )
  )
}

describe('a plain-http page, which anyone on the network can serve', () => {
  it('gets no secrets saved for https or without a scheme', async () => {
    // The save prompt used to store the hostname alone, which counts as https.
    const savedFromPrompt = loginFor('example.com', 'prompt@example.com')
    const httpsLogin = loginFor('https://example.com')
    const totp = totpFor('https://example.com')
    useVault([httpsLogin, savedFromPrompt, totp])

    const state = await getContentScriptInitialState(
      'http://example.com/login',
      9
    )
    expect(state.autofillEnabled).toBe(true)
    expect(state.secretsForHost).toEqual({
      loginCredentials: [],
      totpSecrets: []
    })

    const httpsState = await getContentScriptInitialState(
      'https://example.com/login',
      9
    )
    expect(httpsState.secretsForHost).toEqual({
      loginCredentials: [httpsLogin, savedFromPrompt],
      totpSecrets: [totp]
    })
  })

  it('gets the secrets saved for http, which https pages get too', async () => {
    const httpLogin = loginFor('http://intranet.example.org')
    const httpTotp = totpFor('http://intranet.example.org')
    const httpsLogin = loginFor('https://intranet.example.org', 'admin@test')
    useVault([httpLogin, httpTotp, httpsLogin])

    const state = await getContentScriptInitialState(
      'http://intranet.example.org/login',
      9
    )
    expect(state.secretsForHost).toEqual({
      loginCredentials: [httpLogin],
      totpSecrets: [httpTotp]
    })

    const httpsState = await getContentScriptInitialState(
      'https://intranet.example.org/login',
      9
    )
    expect(httpsState.secretsForHost).toEqual({
      loginCredentials: [httpLogin, httpsLogin],
      totpSecrets: [httpTotp]
    })
  })

  it('does not fall back to a TOTP secret without a URL', async () => {
    const httpLogin = loginFor('http://intranet.example.org')
    const urlLessTotp = totpFor(null)
    useVault([httpLogin, urlLessTotp])

    const state = await getContentScriptInitialState(
      'http://intranet.example.org/login',
      9
    )
    expect(state.secretsForHost).toEqual({
      loginCredentials: [httpLogin],
      totpSecrets: []
    })

    const httpsState = await getContentScriptInitialState(
      'https://intranet.example.org/login',
      9
    )
    expect(httpsState.secretsForHost.totpSecrets).toEqual([urlLessTotp])
  })
})

it.each(['http://localhost:3000/login', 'http://127.0.0.1:3000/login'])(
  'keeps autofilling local development on %s',
  async (localUrl) => {
    const { hostname } = new URL(localUrl)
    const savedFromPrompt = loginFor(hostname)
    const savedForHttp = loginFor(`http://${hostname}:3000`, 'dev@example.com')
    useVault([savedFromPrompt, savedForHttp])

    const state = await getContentScriptInitialState(localUrl, 9)
    expect(state.secretsForHost.loginCredentials).toEqual([
      savedFromPrompt,
      savedForHttp
    ])
  }
)

it('keeps a pending login on its origin when the browser has no document ids', async () => {
  // Firefox: every top-level document of the tab is frame 0 without a documentId.
  const topDocument = (url: string) =>
    getAutofillSender({
      id: browser.runtime.id,
      url,
      frameId: 0,
      tab: {
        id: 9,
        url,
        index: 0,
        active: true,
        highlighted: true,
        pinned: false,
        incognito: false
      }
    })!
  const pending = { username: 'one', password: 'synthetic-one' }
  saveLoginModalsStates.set(
    topDocument('https://example.com/login').key,
    pending
  )

  const stateAt = async (url: string) => {
    const { key } = topDocument(url)
    return (await getContentScriptInitialState(url, 9, key))
      .saveLoginModalsState
  }
  expect(await stateAt('https://example.com/welcome')).toEqual(pending)
  expect(await stateAt('http://example.com/login')).toBeUndefined()
  expect(await stateAt('https://unrelated.example.net/')).toBeUndefined()
})
