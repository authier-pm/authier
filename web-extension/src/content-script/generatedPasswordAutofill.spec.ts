import browser from 'webextension-polyfill'
import {
  GENERATED_PASSWORD_HISTORY_STORAGE_KEY,
  getGeneratedPasswordHistory
} from '@src/util/generatedPasswordHistory'

const renderSaveCredentialsForm = vi.fn().mockResolvedValue(undefined)

vi.mock('./renderSaveCredentialsForm', () => ({
  renderSaveCredentialsForm
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
})
