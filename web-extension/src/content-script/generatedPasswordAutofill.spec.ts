import browser from 'webextension-polyfill'
import {
  GENERATED_PASSWORD_HISTORY_STORAGE_KEY,
  getGeneratedPasswordHistory
} from '@src/util/generatedPasswordHistory'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'

const renderSaveCredentialsForm = vi.fn().mockResolvedValue(undefined)
const addInputEvent = vi.fn()
const getUsername = vi.fn()
const toJSON = vi.fn().mockReturnValue([])
const saveCapturedInputEvents = vi.fn().mockResolvedValue(undefined)

vi.mock('./renderSaveCredentialsForm', () => ({
  renderSaveCredentialsForm
}))

vi.mock('./contentScript', () => ({
  domRecorder: {
    addInputEvent,
    toJSON,
    getUsername,
    getPassword: vi.fn(),
    hasInput: vi.fn().mockReturnValue(false)
  },
  getWebInputKind: (input: HTMLInputElement) =>
    input.type === 'email' ? WebInputType.EMAIL : WebInputType.USERNAME_OR_EMAIL
}))

vi.mock('./connectTRPC', () => ({
  trpc: {
    saveCapturedInputEvents: { mutate: saveCapturedInputEvents }
  }
}))

vi.mock('./isElementInViewport', () => ({
  isElementVisibleInViewport: (element: HTMLElement) => element.isConnected,
  isElementRendered: (element: HTMLElement) => element.isConnected,
  isElementInViewport: () => true,
  isHidden: () => false
}))

describe('handleGeneratedPasswordAutofill', () => {
  const storageState: Record<string, unknown> = {}

  beforeEach(() => {
    Object.assign(window.location, {
      href: 'https://accounts.google.com/signup/v2/createpassword',
      hostname: 'accounts.google.com'
    })

    for (const key of Object.keys(storageState)) {
      delete storageState[key]
    }

    renderSaveCredentialsForm.mockClear()
    addInputEvent.mockClear()
    getUsername.mockClear()
    toJSON.mockReset()
    toJSON.mockReturnValue([])
    saveCapturedInputEvents.mockClear()

    vi.mocked(browser.storage.local.get).mockImplementation(async (key) => {
      if (typeof key === 'string') {
        return { [key]: storageState[key] }
      }

      return storageState
    })
    vi.mocked(browser.storage.local.set).mockImplementation(async (value) => {
      Object.assign(storageState, value)
    })
  })

  it('stores generated passwords before showing the save prompt', async () => {
    const { handleGeneratedPasswordAutofill } = await import('./autofill')

    await handleGeneratedPasswordAutofill('generated-password', {
      showSavePrompt: true
    })

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      kind: 'appendGeneratedPasswordHistory',
      entry: expect.objectContaining({
        password: 'generated-password',
        pageUrl: 'https://accounts.google.com/signup/v2/createpassword',
        hostname: 'accounts.google.com'
      })
    })
    expect(storageState[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]).toBeUndefined()
    expect(renderSaveCredentialsForm).toHaveBeenCalledWith(
      null,
      'generated-password'
    )
  })

  it('records the email and generated password before opening the save prompt', async () => {
    Object.assign(window.location, {
      href: 'https://bsky.app/',
      hostname: 'bsky.app',
      pathname: '/'
    })
    document.body.innerHTML = `<div>
      <input id="email" type="email" autocomplete="email" value="person@example.com" />
      <input id="password" type="password" autocomplete="new-password" />
      <input type="date" value="2000-01-01" />
    </div>`
    const capturedInputs = [
      {
        cssSelector: '#email',
        domOrdinal: 0,
        inputted: 'person@example.com',
        kind: WebInputType.EMAIL,
        type: 'input'
      },
      {
        cssSelector: '#password',
        domOrdinal: 0,
        inputted: 'generated-password',
        kind: WebInputType.PASSWORD,
        type: 'input'
      }
    ]
    toJSON.mockReturnValue(capturedInputs)
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement
    const { handleGeneratedPasswordAutofill } = await import('./autofill')

    await handleGeneratedPasswordAutofill('generated-password', {
      passwordInput,
      showSavePrompt: true
    })

    expect(addInputEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        element: document.getElementById('email'),
        inputted: 'person@example.com',
        kind: WebInputType.EMAIL
      })
    )
    expect(addInputEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        element: passwordInput,
        inputted: 'generated-password',
        kind: WebInputType.PASSWORD
      })
    )
    expect(saveCapturedInputEvents).toHaveBeenCalledWith({
      inputEvents: capturedInputs,
      url: document.documentURI
    })
    expect(renderSaveCredentialsForm).toHaveBeenCalledWith(
      'person@example.com',
      'generated-password'
    )
  })

  it('retries against a password input replaced during the first fill', async () => {
    document.body.innerHTML = `<input
      id="password"
      type="password"
      autocomplete="new-password"
      aria-label="Choose your password"
    />`
    const originalInput = document.getElementById(
      'password'
    ) as HTMLInputElement
    let replacementInput: HTMLInputElement | null = null
    originalInput.addEventListener(
      'input',
      () => {
        replacementInput = originalInput.cloneNode() as HTMLInputElement
        originalInput.replaceWith(replacementInput)
      },
      { once: true }
    )
    const { fillGeneratedPasswordIntoInput, resetAutofillStateForThisPage } =
      await import('./autofill')
    resetAutofillStateForThisPage()

    const filledInput = await fillGeneratedPasswordIntoInput(
      originalInput,
      'generated-password'
    )

    expect(filledInput).toBe(replacementInput)
    expect(replacementInput?.value).toBe('generated-password')
    expect(replacementInput?.style.backgroundColor).toBe('')
  })
})

describe('fillGeneratedPasswordIntoInput confirmation fields', () => {
  const fillInto = async (primaryId: string) => {
    const { fillGeneratedPasswordIntoInput, resetAutofillStateForThisPage } =
      await import('./autofill')
    resetAutofillStateForThisPage()

    return fillGeneratedPasswordIntoInput(
      document.getElementById(primaryId) as HTMLInputElement,
      'generated-password'
    )
  }
  const valueOf = (id: string) =>
    (document.getElementById(id) as HTMLInputElement).value

  it('repeats the password into an unlabelled confirmation field', async () => {
    document.body.innerHTML = `<form>
      <input id="login" type="text" name="login" />
      <input id="password" type="password" name="heslo" />
      <input id="confirm" type="password" name="heslo2" />
      <input id="email" type="email" name="email" />
    </form>`

    await fillInto('password')

    expect(valueOf('password')).toBe('generated-password')
    expect(valueOf('confirm')).toBe('generated-password')
    expect(valueOf('login')).toBe('')
    expect(valueOf('email')).toBe('')
  })

  it('keeps the current password of a change-password form untouched', async () => {
    document.body.innerHTML = `<form>
      <input id="current" type="password" />
      <input id="new" type="password" />
      <input id="confirm" type="password" />
    </form>`

    await fillInto('new')

    expect(valueOf('current')).toBe('')
    expect(valueOf('new')).toBe('generated-password')
    expect(valueOf('confirm')).toBe('generated-password')
  })

  it('fills an earlier field only when it is marked new-password', async () => {
    document.body.innerHTML = `<form>
      <input id="current" type="password" autocomplete="current-password" />
      <input id="new" type="password" autocomplete="new-password" />
      <input id="confirm" type="password" autocomplete="new-password" />
    </form>`

    await fillInto('confirm')

    expect(valueOf('current')).toBe('')
    expect(valueOf('new')).toBe('generated-password')
    expect(valueOf('confirm')).toBe('generated-password')
  })

  it('finds the confirmation field of a formless signup without touching other forms', async () => {
    document.body.innerHTML = `<form id="header-login">
        <input id="header-password" type="password" />
      </form>
      <div>
        <div><input id="password" type="password" /></div>
        <div><input id="confirm" type="password" /></div>
      </div>
      <form><input id="footer-password" type="password" /></form>`

    await fillInto('password')

    expect(valueOf('confirm')).toBe('generated-password')
    expect(valueOf('header-password')).toBe('')
    expect(valueOf('footer-password')).toBe('')
  })

  it('skips disabled and read-only confirmation fields', async () => {
    document.body.innerHTML = `<form>
      <input id="password" type="password" />
      <input id="disabled" type="password" disabled />
      <input id="readonly" type="password" readonly />
    </form>`

    await fillInto('password')

    expect(valueOf('disabled')).toBe('')
    expect(valueOf('readonly')).toBe('')
  })

  it('fills a confirmation field revealed after the first password is typed', async () => {
    document.body.innerHTML = `<form id="signup">
      <input id="password" type="password" />
    </form>`
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement
    passwordInput.addEventListener(
      'input',
      () => {
        const confirmInput = document.createElement('input')
        confirmInput.id = 'confirm'
        confirmInput.type = 'password'
        document.getElementById('signup')?.append(confirmInput)
      },
      { once: true }
    )

    await fillInto('password')

    expect(valueOf('confirm')).toBe('generated-password')
  })

  it('fills a confirmation field that re-renders on input', async () => {
    document.body.innerHTML = `<form>
      <input id="password" type="password" />
      <input id="confirm" type="password" />
    </form>`
    const confirmInput = document.getElementById('confirm') as HTMLInputElement
    confirmInput.addEventListener(
      'input',
      () => confirmInput.replaceWith(confirmInput.cloneNode()),
      { once: true }
    )

    await fillInto('password')

    expect(valueOf('confirm')).toBe('generated-password')
  })
})
