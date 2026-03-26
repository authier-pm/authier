import { ChakraProvider } from '@chakra-ui/react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { PasswordGenerationHistory } from './PasswordGenerationHistory'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import browser from 'webextension-polyfill'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { GeneratedPasswordHistoryEntry } from '@src/util/generatedPasswordHistory'
import { device } from '@src/background/ExtensionDevice'
import React from 'react'

describe('PasswordGenerationHistory', () => {
  const storageState: Record<string, unknown> = {}
  const onStorageChangeListeners = new Set<
    (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => void
  >()

  const generatedHistoryKey = 'generatedPasswordHistory'

  const historyEntries: GeneratedPasswordHistoryEntry[] = [
    {
      id: 'saved-entry',
      password: 'saved-password',
      pageUrl: 'https://accounts.google.com/signup',
      hostname: 'accounts.google.com',
      createdAt: '2037-03-03T13:30:00.000Z'
    },
    {
      id: 'unsaved-entry',
      password: 'unsaved-password',
      pageUrl: 'https://github.com/join',
      hostname: 'github.com',
      createdAt: '2037-03-03T13:33:00.000Z'
    }
  ]

  const renderPage = () => {
    const contextValue = {
      currentTab: null,
      currentURL: '',
      deviceState: device.state,
      isInitialized: true,
      lockedState: null,
      loginCredentials: [
        {
          id: 'login-1',
          encrypted: 'encrypted',
          createdAt: '2037-03-03T12:00:00.000Z',
          kind: EncryptedSecretType.LOGIN_CREDENTIALS,
          lastUsedAt: null,
          loginCredentials: {
            iconUrl: null,
            label: 'Google',
            password: 'saved-password',
            url: 'https://accounts.google.com',
            username: 'saved-user'
          }
        }
      ],
      TOTPSecrets: [],
      registered: true,
      searchSecrets: vi.fn().mockReturnValue([]),
      selectedItems: [],
      setDeviceState: vi.fn(),
      setSecuritySettings: vi.fn(),
      setSelectedItems: vi.fn()
    } as React.ContextType<typeof DeviceStateContext>

    return render(
      <ChakraProvider>
        <DeviceStateContext.Provider value={contextValue}>
          <PasswordGenerationHistory />
        </DeviceStateContext.Provider>
      </ChakraProvider>
    )
  }

  beforeEach(() => {
    storageState[generatedHistoryKey] = historyEntries

    vi.mocked(browser.storage.local.get).mockImplementation(async (key) => {
      if (typeof key === 'string') {
        return { [key]: storageState[key] }
      }

      return storageState
    })
    vi.mocked(browser.storage.local.set).mockImplementation(async (value) => {
      Object.assign(storageState, value)
    })
    vi.mocked(browser.storage.local.remove).mockImplementation(async (key) => {
      delete storageState[key]
    })
    vi.mocked(browser.storage.onChanged.addListener).mockImplementation(
      (listener) => {
        onStorageChangeListeners.add(listener)
      }
    )
    vi.mocked(browser.storage.onChanged.removeListener).mockImplementation(
      (listener) => {
        onStorageChangeListeners.delete(listener)
      }
    )
    vi.mocked(device.state!.addSecrets).mockResolvedValue([])
    vi.mocked(device.state!.encrypt).mockResolvedValue('encrypted-string')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    onStorageChangeListeners.clear()
    vi.restoreAllMocks()
  })

  it('shows saved state, opens the save-later form, and clears history', async () => {
    const user = userEvent.setup()

    renderPage()

    expect(
      await screen.findByText('Password generation history')
    ).toBeTruthy()
    expect(screen.getByText('accounts.google.com')).toBeTruthy()
    expect(screen.getByText('github.com')).toBeTruthy()
    expect(screen.getByText('Saved')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Save generated password')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Save credential' })
    )

    expect(await screen.findByText('Required')).toBeTruthy()

    await user.type(screen.getByLabelText('Username'), 'new-user')
    await user.click(
      screen.getByRole('button', { name: 'Save credential' })
    )

    await waitFor(() => {
      expect(device.state!.addSecrets).toHaveBeenCalledTimes(1)
    })
    expect(device.state!.addSecrets).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        loginCredentials: expect.objectContaining({
          url: 'github.com',
          label: 'github.com',
          username: 'new-user',
          password: 'unsaved-password'
        })
      })
    ])

    await user.click(screen.getByRole('button', { name: 'Clear history' }))

    await waitFor(() => {
      expect(browser.storage.local.remove).toHaveBeenCalledWith(
        generatedHistoryKey
      )
    })
    expect(
      screen.getByText('No generated passwords have been recorded yet.')
    ).toBeTruthy()
  })
})
