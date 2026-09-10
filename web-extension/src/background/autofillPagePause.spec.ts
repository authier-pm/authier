import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  AutofillPagePauseMessageKind,
  isAutofillPagePauseGetMessage,
  isAutofillPagePauseSetMessage,
  isAutofillPausedForPage,
  refreshAutofillForDomain,
  setAutofillPausedForPage
} from './autofillPagePause'

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: { local: { get: vi.fn(), remove: vi.fn(), set: vi.fn() } },
    tabs: { query: vi.fn(), sendMessage: vi.fn() }
  }
}))

describe('persistent autofill domain pause', () => {
  let stored: Record<string, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    stored = {}
    vi.mocked(browser.storage.local.get).mockImplementation(async (key) =>
      typeof key === 'string' ? { [key]: stored[key] } : {}
    )
    vi.mocked(browser.storage.local.set).mockImplementation(async (items) => {
      Object.assign(stored, items)
    })
    vi.mocked(browser.storage.local.remove).mockImplementation(async (key) => {
      if (typeof key === 'string') delete stored[key]
    })
  })

  const pause = (url: string, paused = true) =>
    setAutofillPausedForPage({ paused, tabId: 17, url })

  it('persists across paths, queries, fragments, ports and other tabs', async () => {
    await pause('https://EXAMPLE.com/login')
    expect(stored).toEqual({ 'autofillPausedDomain:example.com': true })
    for (const url of [
      'https://example.com/account',
      'https://example.com/login?next=/account#form',
      'http://example.com:8080/another'
    ]) {
      await expect(isAutofillPausedForPage(23, url)).resolves.toBe(true)
    }
    expect(browser.storage.local.remove).not.toHaveBeenCalled()
  })

  it('keeps the pause when leaving and returning and isolates other hostnames', async () => {
    await pause('https://example.com/login')
    for (const url of [
      'https://other.com/login',
      'https://sub.example.com/login',
      'https://example.com.evil.com/login'
    ]) {
      await expect(isAutofillPausedForPage(17, url)).resolves.toBe(false)
    }
    await expect(
      isAutofillPausedForPage(99, 'https://example.com/back')
    ).resolves.toBe(true)
  })

  it('reads persisted browser storage after background initialization', async () => {
    stored['autofillPausedDomain:example.com'] = true
    await expect(
      isAutofillPausedForPage(100, 'https://example.com/new')
    ).resolves.toBe(true)
  })

  it('only removes the selected domain when enabled from another path or tab', async () => {
    await pause('https://example.com/login')
    await pause('https://other.com/login')
    await setAutofillPausedForPage({
      paused: false,
      tabId: 23,
      url: 'https://example.com/account'
    })
    await expect(
      isAutofillPausedForPage(17, 'https://example.com/login')
    ).resolves.toBe(false)
    await expect(
      isAutofillPausedForPage(17, 'https://other.com/login')
    ).resolves.toBe(true)
  })

  it('ignores unsupported and invalid URLs', async () => {
    for (const url of ['chrome://settings', 'about:blank', 'invalid']) {
      await pause(url)
      await expect(isAutofillPausedForPage(17, url)).resolves.toBe(false)
    }
    expect(browser.storage.local.set).not.toHaveBeenCalled()
  })

  it('refreshes all matching tabs and tolerates missing content scripts', async () => {
    vi.mocked(browser.tabs.query).mockResolvedValue([
      { id: 17, url: 'https://example.com/login' },
      { id: 23, url: 'https://example.com/account' },
      { id: 42, url: 'https://other.com/login' }
    ] as browser.Tabs.Tab[])
    vi.mocked(browser.tabs.sendMessage).mockResolvedValue(undefined)
    vi.mocked(browser.tabs.sendMessage).mockRejectedValueOnce(
      new Error('Tab closed')
    )
    await refreshAutofillForDomain('https://example.com/settings')
    expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(2)
    for (const tabId of [17, 23]) {
      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(tabId, {
        kind: AutofillPagePauseMessageKind.REFRESH
      })
    }
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
})
