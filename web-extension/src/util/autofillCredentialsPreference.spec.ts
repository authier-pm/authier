import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY,
  getAutofillCredentialsEnabled,
  setAutofillCredentialsEnabled
} from './autofillCredentialsPreference'

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn()
      }
    }
  }
}))

describe('autofill credentials preference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to enabled when no local preference exists', async () => {
    vi.mocked(browser.storage.local.get).mockResolvedValue({})

    await expect(getAutofillCredentialsEnabled()).resolves.toBe(true)
  })

  it('reads and writes the local preference', async () => {
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      [AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY]: false
    })

    await expect(getAutofillCredentialsEnabled()).resolves.toBe(false)

    await setAutofillCredentialsEnabled(false)
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY]: false
    })
  })
})
