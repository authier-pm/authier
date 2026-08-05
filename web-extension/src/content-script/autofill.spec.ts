import browser from 'webextension-polyfill'
import type { IInitStateRes } from './contentScript'

const renderSaveCredentialsForm = vi.fn().mockResolvedValue(undefined)
const renderLoginCredOption = vi.fn()
const renderPasswordGenerator = vi.fn()
const notyfSuccess = vi.fn()

vi.mock('./renderSaveCredentialsForm', () => ({ renderSaveCredentialsForm }))
vi.mock('./renderLoginCredOption', () => ({ renderLoginCredOption }))
vi.mock('./renderPasswordGenerator', () => ({ renderPasswordGenerator }))
vi.mock('./notyf', () => ({
  notyf: { success: notyfSuccess, error: vi.fn() }
}))
vi.mock('./connectTRPC', () => ({
  trpc: {
    saveCapturedInputEvents: { mutate: vi.fn().mockResolvedValue(undefined) },
    executeMainWorldAutofillFunction: {
      mutate: vi.fn().mockResolvedValue([])
    },
    getContentScriptInitialState: { query: vi.fn().mockResolvedValue(null) }
  }
}))
vi.mock('./contentScript', () => ({
  domRecorder: {
    addInputEvent: vi.fn(),
    toJSON: vi.fn().mockReturnValue([]),
    getUsername: vi.fn(),
    getPassword: vi.fn(),
    hasInput: vi.fn().mockReturnValue(false)
  }
}))
// jsdom does no layout, so every element would read as invisible
vi.mock('./isElementInViewport', () => ({
  isElementVisibleInViewport: () => true,
  isElementInViewport: () => true,
  isHidden: () => false
}))

const STORED_USERNAME = 'jiri@example.com'
const STORED_PASSWORD = 'stored-password-42'

const initState = (webInputs: IInitStateRes['webInputs'] = []) =>
  ({
    extensionDeviceReady: true,
    autofillEnabled: true,
    webInputs,
    secretsForHost: {
      loginCredentials: [
        {
          lastUsedAt: '2025-01-01T00:00:00.000Z',
          loginCredentials: {
            username: STORED_USERNAME,
            password: STORED_PASSWORD
          }
        }
      ],
      totpSecrets: []
    }
  }) as unknown as IInitStateRes

const setPage = (html: string, { url = '/', lang = 'en' } = {}) => {
  const parsed = new URL(url, 'https://example.com')
  Object.assign(window.location, {
    href: parsed.href,
    pathname: parsed.pathname,
    search: parsed.search,
    host: parsed.host,
    hostname: parsed.hostname,
    origin: parsed.origin,
    protocol: parsed.protocol
  })
  document.documentElement.setAttribute('lang', lang)
  document.body.innerHTML = html
}

const inputById = (id: string) =>
  document.getElementById(id) as HTMLInputElement

/** runs autofill past its 150ms "let the page load" delay */
const runAutofill = async (state = initState()) => {
  const { autofill, resetAutofillStateForThisPage, debouncedAutofill } =
    await import('./autofill')
  void debouncedAutofill
  resetAutofillStateForThisPage()

  const teardown = autofill(state)
  await vi.advanceTimersByTimeAsync(200)
  return teardown
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 10
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 10
  })

  // the global window object here fails `instanceof Window`, so jsdom rejects
  // `new MouseEvent('click', { view: window })` outright. Autofill's synthetic
  // submit click needs a MouseEvent that actually constructs.
  vi.stubGlobal(
    'MouseEvent',
    class extends Event {
      constructor(type: string, init?: EventInit) {
        super(type, init)
      }
    }
  )
})

beforeEach(() => {
  vi.useFakeTimers()
  renderLoginCredOption.mockClear()
  renderPasswordGenerator.mockClear()
  renderSaveCredentialsForm.mockClear()
  notyfSuccess.mockClear()
  vi.mocked(browser.storage.local.get).mockResolvedValue({})
  vi.mocked(browser.storage.local.set).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('autofill on a login page', () => {
  it('fills username and password', async () => {
    setPage(
      `<form>
        <input id="user" type="text" autocomplete="username" />
        <input id="pw" type="password" autocomplete="current-password" />
        <button type="submit">Sign in</button>
      </form>`,
      { url: '/login' }
    )

    await runAutofill()

    expect(inputById('user').value).toBe(STORED_USERNAME)
    expect(inputById('pw').value).toBe(STORED_PASSWORD)
  })

  it('fills the password on a password-only second step', async () => {
    setPage(
      `<form>
        <input id="pw" type="password" autocomplete="current-password" />
      </form>`,
      { url: '/signin/challenge/pwd' }
    )

    await runAutofill()

    expect(inputById('pw').value).toBe(STORED_PASSWORD)
  })

  it('does not treat a site search box as the username', async () => {
    setPage(
      `<form>
        <input id="q" type="text" name="search" />
        <input id="user" type="text" autocomplete="username" />
        <input id="pw" type="password" autocomplete="current-password" />
      </form>`,
      { url: '/login' }
    )

    await runAutofill()

    expect(inputById('q').value).toBe('')
    expect(inputById('user').value).toBe(STORED_USERNAME)
  })
})

describe('autofill on a change-password page', () => {
  const CHANGE_PASSWORD_FORM = `
    <header><a href="/logout">Log out</a></header>
    <h2>Change password</h2>
    <form>
      <input id="old" type="password" autocomplete="current-password" />
      <input id="new" type="password" autocomplete="new-password" />
      <input id="confirm" type="password" autocomplete="new-password" />
      <button type="submit">Update password</button>
    </form>`

  it('writes nothing at all', async () => {
    setPage(CHANGE_PASSWORD_FORM, { url: '/settings/security' })

    await runAutofill()

    expect(inputById('old').value).toBe('')
    expect(inputById('new').value).toBe('')
    expect(inputById('confirm').value).toBe('')
  })

  it('offers the credential picker instead', async () => {
    setPage(CHANGE_PASSWORD_FORM, { url: '/settings/security' })

    await runAutofill()

    expect(renderLoginCredOption).toHaveBeenCalledTimes(1)
  })

  it('offers the generator rather than typing a new password', async () => {
    setPage(CHANGE_PASSWORD_FORM, { url: '/settings/security' })

    await runAutofill()

    expect(renderPasswordGenerator).toHaveBeenCalledWith({
      input: inputById('new')
    })
    expect(renderSaveCredentialsForm).not.toHaveBeenCalled()
  })

  it('ignores a stored DOM path pointing at a new-password field', async () => {
    setPage(CHANGE_PASSWORD_FORM, { url: '/settings/security' })

    await runAutofill(
      initState([
        {
          domPath: '#new',
          domOrdinal: 0,
          kind: 'PASSWORD',
          url: 'https://example.com/login',
          host: 'example.com',
          createdAt: new Date().toString()
        }
      ] as unknown as IInitStateRes['webInputs'])
    )

    expect(inputById('new').value).toBe('')
  })
})

describe('autofill on a signup page', () => {
  it('offers the generator and types nothing', async () => {
    setPage(
      `<form>
        <input id="user" type="email" autocomplete="username" />
        <input id="pw" type="password" autocomplete="new-password" />
        <input id="pw2" type="password" autocomplete="new-password" />
      </form>`,
      { url: '/join' }
    )

    await runAutofill()

    expect(renderPasswordGenerator).toHaveBeenCalledWith({
      input: inputById('pw')
    })
    expect(inputById('pw').value).toBe('')
    expect(inputById('pw2').value).toBe('')
    expect(inputById('user').value).toBe('')
  })
})

describe('autofill on an unclassifiable page', () => {
  it('offers the picker instead of guessing', async () => {
    setPage(
      `<form>
        <input id="something" type="text" name="whatever" />
        <input id="pw" type="password" />
      </form>`,
      { url: '/some/page' }
    )

    await runAutofill()

    expect(inputById('pw').value).toBe('')
    expect(inputById('something').value).toBe('')
    expect(renderLoginCredOption).toHaveBeenCalledTimes(1)
  })

  it('keeps watching for inputs added later', async () => {
    setPage(
      `<form>
        <input id="something" type="text" name="whatever" />
        <input id="pw" type="password" />
      </form>`,
      { url: '/some/page' }
    )

    await runAutofill()

    // a signup form shows up after we already gave up on the page
    const { bodyInputChangeEmitter } = await import('./domMutationObserver')
    document.body.innerHTML = `<form>
      <input type="email" autocomplete="username" />
      <input id="newpw" type="password" autocomplete="new-password" />
      <input id="newpw2" type="password" autocomplete="new-password" />
    </form>`
    bodyInputChangeEmitter.emit('inputAdded', inputById('newpw'))
    await vi.advanceTimersByTimeAsync(600)

    expect(renderPasswordGenerator).toHaveBeenCalledWith({
      input: inputById('newpw')
    })
    expect(inputById('newpw').value).toBe('')
  })

  it('gives up on a non-english page with no autocomplete attributes', async () => {
    setPage(
      `<form>
        <input id="user" type="text" name="benutzer" />
        <input id="pw" type="password" />
        <button type="submit">Anmelden</button>
      </form>`,
      { url: '/anmelden', lang: 'de' }
    )

    await runAutofill()

    expect(inputById('pw').value).toBe('')
    expect(renderLoginCredOption).toHaveBeenCalledTimes(1)
  })
})

describe('auto-submit', () => {
  const submitSpy = vi.fn()

  const loginPage = (extra = '') =>
    setPage(
      `<form>
        <input id="user" type="text" autocomplete="username" />
        <input id="pw" type="password" autocomplete="current-password" />
        <button id="submit" type="submit">Sign in</button>
      </form>${extra}`,
      { url: '/login' }
    )

  beforeEach(() => {
    submitSpy.mockClear()
  })

  it('submits a high confidence login form', async () => {
    loginPage()
    document.getElementById('submit')!.addEventListener('click', submitSpy)

    await runAutofill()

    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  it('never submits a form it could only classify structurally', async () => {
    setPage(
      `<form id="login-form">
        <input id="user" type="email" name="email" />
        <input id="pw" type="password" />
        <button id="submit" type="submit">Přihlásit</button>
      </form>`,
      { url: '/login', lang: 'cs' }
    )
    document.getElementById('submit')!.addEventListener('click', submitSpy)

    await runAutofill()

    // low confidence still fills, it just must not press the button
    expect(inputById('pw').value).toBe(STORED_PASSWORD)
    expect(submitSpy).not.toHaveBeenCalled()
  })
})
