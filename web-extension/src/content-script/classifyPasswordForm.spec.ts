import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import {
  classifyPageForAutofill,
  classifyPasswordForm,
  isEnglishPage,
  isPlausibleUsernameInput,
  PasswordFormKind,
  resetLanguageCache
} from './classifyPasswordForm'

/**
 * jsdom does no layout, so offsetWidth/offsetHeight are always 0 and
 * filterUselessInputs would reject every input. Give every element a box.
 */
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 10
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 10
  })
})

/**
 * tests/vitest.setup.ts swaps window.location for a plain writable object, so
 * history.pushState cannot move the page. Assign the fields the classifier reads.
 */
const setUrl = (url: string) => {
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
}

const originalLocation = { ...window.location }
afterAll(() => {
  Object.assign(window.location, originalLocation)
})

const setPage = ({
  html,
  url = '/',
  lang = 'en'
}: {
  html: string
  url?: string
  lang?: string | null
}) => {
  setUrl(url)
  if (lang === null) {
    document.documentElement.removeAttribute('lang')
  } else {
    document.documentElement.setAttribute('lang', lang)
  }
  document.body.innerHTML = html
  resetLanguageCache()
}

const firstPassword = () =>
  document.querySelector('input[type="password"]') as HTMLInputElement

/** signals carry their weight as a suffix, e.g. `2a:logout-href:-3` */
const hasSignal = (signals: string[], name: string) =>
  signals.some((signal) => signal === name || signal.startsWith(`${name}:`))

const visibleInputs = () =>
  Array.from(document.querySelectorAll('input')) as HTMLInputElement[]

beforeEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  setUrl('/')
  document.documentElement.setAttribute('lang', 'en')
  resetLanguageCache()
})

describe('tier 1 - respecting the autocomplete attribute above all else', () => {
  it('classifies a login form as LOGIN', () => {
    setPage({
      url: '/login',
      html: `
        <form>
          <input type="text" name="login" autocomplete="username" />
          <input type="password" autocomplete="current-password" />
          <button type="submit">Sign in</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(result.confidence).toBe('high')
    expect(result.currentPasswordInput).toBe(firstPassword())
    expect(result.newPasswordInputs).toEqual([])
    expect(result.usernameInput?.getAttribute('name')).toBe('login')
  })

  it('classifies current + new + confirm as CHANGE_PASSWORD', () => {
    setPage({
      url: '/settings/admin',
      html: `
        <form>
          <input type="password" id="old" autocomplete="current-password" />
          <input type="password" id="new" autocomplete="new-password" />
          <input type="password" id="confirm" autocomplete="new-password" />
          <button type="submit">Update password</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    expect(result.confidence).toBe('high')
    expect(result.currentPasswordInput?.id).toBe('old')
    expect(result.newPasswordInputs.map((el) => el.id)).toEqual([
      'new',
      'confirm'
    ])
  })

  it('classifies two new-password fields without a current one as SIGNUP', () => {
    setPage({
      url: '/join',
      html: `
        <form>
          <input type="email" autocomplete="username" />
          <input type="password" id="pw" autocomplete="new-password" />
          <input type="password" id="pw2" autocomplete="new-password" />
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.SIGNUP)
    expect(result.confidence).toBe('high')
    expect(result.currentPasswordInput).toBeNull()
    expect(result.newPasswordInputs.map((el) => el.id)).toEqual(['pw', 'pw2'])
  })

  it('classifies three bare password inputs as CHANGE_PASSWORD', () => {
    setPage({
      url: '/u/profile',
      html: `
        <form>
          <input type="password" id="a" />
          <input type="password" id="b" />
          <input type="password" id="c" />
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    expect(result.confidence).toBe('high')
    expect(result.currentPasswordInput?.id).toBe('a')
    expect(result.newPasswordInputs.map((el) => el.id)).toEqual(['b', 'c'])
  })

  it('lets tier 1 beat a "Sign out" link elsewhere on the page', () => {
    setPage({
      url: '/account/security',
      html: `
        <header><a href="/logout">Sign out</a></header>
        <form>
          <input type="text" autocomplete="username" />
          <input type="password" autocomplete="current-password" />
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(hasSignal(result.signals, 'tier1:single-current-password')).toBe(
      true
    )
  })
})

describe('tier 2 - attribute-less pages', () => {
  it('classifies a bare login form as LOGIN', () => {
    setPage({
      url: '/login',
      html: `
        <form>
          <input type="text" name="user" />
          <input type="password" />
          <button type="submit">Log in</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(hasSignal(result.signals, '2a:login-url')).toBe(true)
    expect(hasSignal(result.signals, '2b:login-submit-text')).toBe(true)
  })

  it('classifies a bare settings page as CHANGE_PASSWORD', () => {
    setPage({
      url: '/account/security',
      html: `
        <header><a href="/logout">Log out</a></header>
        <h2>Change password</h2>
        <form>
          <input type="password" id="old" />
          <input type="password" id="new" />
          <button type="submit">Save</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    expect(result.confidence).toBe('high')
    expect(hasSignal(result.signals, '2a:logout-href')).toBe(true)
    expect(hasSignal(result.signals, '2b:save-submit-text')).toBe(true)
    expect(result.currentPasswordInput?.id).toBe('old')
    expect(result.newPasswordInputs.map((el) => el.id)).toEqual(['new'])
  })

  it('returns UNKNOWN when nothing tips the balance', () => {
    setPage({
      url: '/some/page',
      html: `
        <form>
          <input type="text" name="whatever" />
          <input type="password" />
        </form>`
    })

    expect(classifyPasswordForm(firstPassword()).kind).toBe(
      PasswordFormKind.UNKNOWN
    )
  })
})

describe('username input selection', () => {
  it('never picks a search box as the username', () => {
    setPage({
      url: '/login',
      html: `
        <form>
          <input type="search" name="q" />
          <input type="text" name="search-site" />
          <input type="text" name="email" autocomplete="username" />
          <input type="password" autocomplete="current-password" />
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.usernameInput?.getAttribute('name')).toBe('email')
  })

  it('rejects search, coupon and readonly inputs', () => {
    document.body.innerHTML = `
      <input type="search" id="a" />
      <input type="text" name="coupon-code" id="b" />
      <input type="text" id="c" readonly />
      <input type="text" name="email" id="d" />`

    const byId = (id: string) => document.getElementById(id) as HTMLInputElement

    expect(isPlausibleUsernameInput(byId('a'))).toBe(false)
    expect(isPlausibleUsernameInput(byId('b'))).toBe(false)
    expect(isPlausibleUsernameInput(byId('c'))).toBe(false)
    expect(isPlausibleUsernameInput(byId('d'))).toBe(true)
  })
})

describe('scope resolution', () => {
  it('only looks at inputs inside the credential form', () => {
    setPage({
      url: '/login',
      html: `
        <nav><input type="text" name="site-search" /></nav>
        <form id="login-form">
          <input type="text" name="username" />
          <input type="password" />
          <button type="submit">Sign in</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect((result.scope as HTMLElement).id).toBe('login-form')
    expect(result.usernameInput?.getAttribute('name')).toBe('username')
  })

  it('falls back to the nearest ancestor when the site ships no form', () => {
    setPage({
      url: '/login',
      html: `
        <div id="wrapper">
          <input type="text" name="username" />
          <input type="password" />
        </div>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect((result.scope as HTMLElement).id).toBe('wrapper')
  })
})

describe('multi step login pages', () => {
  it('treats a username-only page as LOGIN', () => {
    setPage({
      url: '/signin/identifier',
      html: `<form><input type="email" autocomplete="username" /></form>`
    })

    const result = classifyPageForAutofill(visibleInputs())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(result.currentPasswordInput).toBeNull()
    expect(result.usernameInput?.type).toBe('email')
  })

  it('treats a password-only page as LOGIN', () => {
    setPage({
      url: '/signin/challenge/pwd',
      html: `<form><input type="password" autocomplete="current-password" /></form>`
    })

    const result = classifyPageForAutofill(visibleInputs())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(result.confidence).toBe('high')
  })
})

describe('the language gate', () => {
  it.each([
    ['en', true],
    ['en-GB', true],
    ['EN-US', true],
    ['de', false],
    ['cs-CZ', false],
    ['', false]
  ])('lang="%s" -> isEnglishPage %s', (lang, expected) => {
    setPage({ html: '', lang })

    expect(isEnglishPage()).toBe(expected)
  })

  it('treats an absent lang attribute as not english', () => {
    setPage({ html: '', lang: null })

    expect(isEnglishPage()).toBe(false)
  })

  it('memoizes per URL', () => {
    setPage({ html: '', lang: 'en' })
    expect(isEnglishPage()).toBe(true)

    document.documentElement.setAttribute('lang', 'de')
    expect(isEnglishPage()).toBe(true) // same URL, memoized

    setUrl('/other')
    expect(isEnglishPage()).toBe(false)
  })

  it('does not throw when the top frame is cross-origin', () => {
    setPage({ html: '', lang: null })
    const fakeTop = {
      get document() {
        throw new Error('cross-origin')
      }
    }
    vi.spyOn(window, 'top', 'get').mockReturnValue(fakeTop as never)

    expect(isEnglishPage()).toBe(false)
  })

  it('still classifies a non-english change-password form via tier 1', () => {
    setPage({
      url: '/einstellungen/sicherheit',
      lang: 'de',
      html: `
        <h2>Passwort ändern</h2>
        <form>
          <input type="password" id="old" autocomplete="current-password" />
          <input type="password" id="new" autocomplete="new-password" />
          <button type="submit">Speichern</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    expect(result.confidence).toBe('high')
  })

  it('gives up on a non-english attribute-less login page', () => {
    setPage({
      url: '/anmelden',
      lang: 'de',
      html: `
        <form>
          <input type="text" name="benutzer" />
          <input type="password" />
          <button type="submit">Anmelden</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.UNKNOWN)
    expect(hasSignal(result.signals, '2b:skipped-non-english')).toBe(true)
  })

  it('still catches a non-english change-password page from structure alone', () => {
    setPage({
      url: '/einstellungen',
      lang: 'de',
      html: `
        <header><a href="/abmelden?action=logout">Abmelden</a></header>
        <form>
          <input type="password" id="old" />
          <input type="password" id="new" />
          <button type="submit">Speichern</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    expect(hasSignal(result.signals, '2a:logout-href')).toBe(true)
  })

  it('caps confidence at low when a non-english page scores as LOGIN', () => {
    setPage({
      url: '/login',
      lang: 'cs',
      html: `
        <form id="login-form">
          <input type="email" name="email" />
          <input type="password" />
          <button type="submit">Přihlásit</button>
        </form>`
    })

    const result = classifyPasswordForm(firstPassword())

    expect(result.kind).toBe(PasswordFormKind.LOGIN)
    expect(result.confidence).toBe('low')
    expect(hasSignal(result.signals, '2b:skipped-non-english')).toBe(true)
  })
})
