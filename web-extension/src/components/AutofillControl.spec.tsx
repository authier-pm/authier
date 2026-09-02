import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import type { ContextType } from 'react'
import { AutofillPagePauseMessageKind } from '@src/background/autofillPagePause'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AutofillControl } from './AutofillControl'

const setSecuritySettings = vi.fn().mockResolvedValue(undefined)

const contextValue = {
  currentTab: { id: 17 },
  currentURL: 'https://example.com/login',
  deviceState: {
    autofillCredentialsEnabled: true,
    autofillForbiddenUrlPatterns: '',
    autofillTOTPEnabled: true,
    notificationOnVaultUnlock: false,
    notificationOnWrongPasswordAttempts: 3,
    syncTOTP: true,
    uiLanguage: 'en',
    vaultLockTimeoutSeconds: 300
  },
  setSecuritySettings
} as unknown as ContextType<typeof DeviceStateContext>

const renderControl = () =>
  render(
    <DeviceStateContext.Provider value={contextValue}>
      <AutofillControl />
    </DeviceStateContext.Provider>
  )

describe('AutofillControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue(false)
  })

  it('pauses autofill for the current page from the popover', async () => {
    const user = userEvent.setup()
    renderControl()

    await user.click(await screen.findByRole('button', { name: /Autofill on/ }))
    expect(
      screen.getByRole('dialog', { name: 'Autofill controls' })
    ).toBeTruthy()

    vi.mocked(browser.runtime.sendMessage).mockResolvedValueOnce(true)
    await user.click(
      screen.getByRole('switch', { name: 'Autofill on this page' })
    )

    expect(browser.runtime.sendMessage).toHaveBeenLastCalledWith({
      kind: AutofillPagePauseMessageKind.SET,
      paused: true,
      tabId: 17,
      url: 'https://example.com/login'
    })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Autofill paused/ })
      ).toBeTruthy()
    })
  })

  it('keeps the popover open when a switch click has no blur target', async () => {
    const user = userEvent.setup()
    renderControl()

    const trigger = await screen.findByRole('button', { name: /Autofill on/ })
    await user.click(trigger)
    const pageSwitch = screen.getByRole('switch', {
      name: 'Autofill on this page'
    })

    fireEvent.pointerDown(pageSwitch)
    fireEvent.blur(trigger, { relatedTarget: null })

    expect(
      screen.getByRole('dialog', { name: 'Autofill controls' })
    ).toBeTruthy()

    vi.mocked(browser.runtime.sendMessage).mockResolvedValueOnce(true)
    await user.click(pageSwitch)

    await waitFor(() => {
      expect(pageSwitch.getAttribute('aria-checked')).toBe('false')
      expect(
        screen.getByRole('dialog', { name: 'Autofill controls' })
      ).toBeTruthy()
    })
  })

  it('keeps the existing browser-wide autofill preference', async () => {
    const user = userEvent.setup()
    renderControl()

    await user.click(await screen.findByRole('button', { name: /Autofill on/ }))
    await user.click(
      screen.getByRole('switch', { name: 'Autofill on all pages' })
    )

    expect(setSecuritySettings).toHaveBeenCalledWith({
      autofillCredentialsEnabled: false,
      autofillForbiddenUrlPatterns: '',
      autofillTOTPEnabled: true,
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 3,
      syncTOTP: true,
      uiLanguage: 'en',
      vaultLockTimeoutSeconds: 300
    })
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(17, {
      kind: AutofillPagePauseMessageKind.REFRESH
    })
  })
})
