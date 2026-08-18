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

    const history = await getGeneratedPasswordHistory()

    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      password: 'generated-password',
      pageUrl: 'https://accounts.google.com/signup/v2/createpassword',
      hostname: 'accounts.google.com',
      createdAt: '2037-03-03T13:33:33.333Z'
    })
    expect(storageState[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]).toEqual(
      history
    )
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
