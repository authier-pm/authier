import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  AutofillPagePauseMessageKind,
  clearAutofillPagePause,
  isAutofillPagePauseGetMessage,
  isAutofillPagePauseSetMessage,
  isAutofillPausedForPage,
  setAutofillPausedForPage
} from './autofillPagePause'

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      session: {
        get: vi.fn(),
        remove: vi.fn(),
        set: vi.fn()
      }
    }
  }
}))

const sessionStorage = browser.storage.session

describe('temporary autofill page pause', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(browser.storage, 'session', {
      configurable: true,
      value: sessionStorage
    })
    vi.mocked(browser.storage.session.get).mockResolvedValue({})
  })

  it('stores and clears a pause for one tab', async () => {
    await setAutofillPausedForPage({
      paused: true,
      tabId: 17,
      url: 'https://example.com/login'
    })

    expect(browser.storage.session.set).toHaveBeenCalledWith({
      'autofillPausedPage:17': 'https://example.com/login'
    })

    await clearAutofillPagePause(17)
    expect(browser.storage.session.remove).toHaveBeenCalledWith(
      'autofillPausedPage:17'
    )
  })

  it('only pauses the exact page and clears the pause after navigation', async () => {
    vi.mocked(browser.storage.session.get).mockResolvedValue({
      'autofillPausedPage:17': 'https://example.com/login'
    })

    await expect(
      isAutofillPausedForPage(17, 'https://example.com/login')
    ).resolves.toBe(true)
    await expect(
      isAutofillPausedForPage(17, 'https://example.com/account')
    ).resolves.toBe(false)
    expect(browser.storage.session.remove).toHaveBeenCalledWith(
      'autofillPausedPage:17'
    )
  })

  it('validates popup pause messages', () => {
    expect(
      isAutofillPagePauseGetMessage({
        kind: AutofillPagePauseMessageKind.GET,
        tabId: 17,
        url: 'https://example.com/login'
      })
    ).toBe(true)
    expect(
      isAutofillPagePauseSetMessage({
        kind: AutofillPagePauseMessageKind.SET,
        paused: true,
        tabId: 17,
        url: 'https://example.com/login'
      })
    ).toBe(true)
    expect(
      isAutofillPagePauseSetMessage({
        kind: AutofillPagePauseMessageKind.SET,
        paused: 'yes',
        tabId: 17,
        url: 'https://example.com/login'
      })
    ).toBe(false)
  })

  it('falls back to memory for Firefox versions without session storage', async () => {
    Object.defineProperty(browser.storage, 'session', {
      configurable: true,
      value: undefined
    })

    await setAutofillPausedForPage({
      paused: true,
      tabId: 23,
      url: 'https://example.com/sign-in'
    })

    await expect(
      isAutofillPausedForPage(23, 'https://example.com/sign-in')
    ).resolves.toBe(true)
    await clearAutofillPagePause(23)
    await expect(
      isAutofillPausedForPage(23, 'https://example.com/sign-in')
    ).resolves.toBe(false)
  })
})
