import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import { passkeyCreationVerification } from './passkeyCreationPreference'

vi.mock('webextension-polyfill', () => ({
  default: { storage: { local: { get: vi.fn(), set: vi.fn() } } }
}))

describe('device-local passkey creation preference', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([undefined, null, 'false', 0, true])(
    'requires verification unless the stored preference is explicitly false (%s)',
    async (value) => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        passkeyCreationVerificationRequired: value
      })
      await expect(passkeyCreationVerification.get()).resolves.toBe(true)
    }
  )

  it('persists the opt-in on this browser only and can switch back', async () => {
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      passkeyCreationVerificationRequired: false
    })
    await expect(passkeyCreationVerification.get()).resolves.toBe(false)
    await passkeyCreationVerification.set(false)
    expect(browser.storage.local.set).toHaveBeenLastCalledWith({
      passkeyCreationVerificationRequired: false
    })
    await passkeyCreationVerification.set(true)
    expect(browser.storage.local.set).toHaveBeenLastCalledWith({
      passkeyCreationVerificationRequired: true
    })
  })

  it.each([true, false])(
    'initializes a new browser with its inherited value (%s)',
    async (value) => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({})
      await passkeyCreationVerification.initialize(value)
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        passkeyCreationVerificationRequired: value
      })
    }
  )

  it.each([true, false])(
    'preserves an existing local choice (%s) on later logins',
    async (value) => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        passkeyCreationVerificationRequired: value
      })
      await passkeyCreationVerification.initialize(!value)
      expect(browser.storage.local.set).not.toHaveBeenCalled()
    }
  )
})
