import browser from 'webextension-polyfill'
import {
  appendGeneratedPasswordHistoryEntry,
  clearGeneratedPasswordHistory,
  createGeneratedPasswordHistoryEntry,
  GENERATED_PASSWORD_HISTORY_STORAGE_KEY,
  getGeneratedPasswordHistory,
  normalizeHistoryHostname
} from './generatedPasswordHistory'

describe('generatedPasswordHistory', () => {
  const storageState: Record<string, unknown> = {}

  beforeEach(() => {
    for (const key of Object.keys(storageState)) {
      delete storageState[key]
    }

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
  })

  it('appends, reads and clears generated password history in newest-first order', async () => {
    const olderEntry = createGeneratedPasswordHistoryEntry({
      createdAt: '2037-03-03T13:00:00.000Z',
      pageUrl: 'https://accounts.google.com/signup',
      password: 'older-password'
    })
    const newerEntry = createGeneratedPasswordHistoryEntry({
      createdAt: '2037-03-03T13:30:00.000Z',
      pageUrl: 'https://github.com/join',
      password: 'newer-password'
    })

    await appendGeneratedPasswordHistoryEntry(olderEntry)
    await appendGeneratedPasswordHistoryEntry(newerEntry)

    const history = await getGeneratedPasswordHistory()

    expect(history).toEqual([newerEntry, olderEntry])
    expect(storageState[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]).toEqual([
      newerEntry,
      olderEntry
    ])

    await clearGeneratedPasswordHistory()

    expect(storageState[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]).toBeUndefined()
    expect(await getGeneratedPasswordHistory()).toEqual([])
  })

  it('normalizes hostnames from either full URLs or saved hostnames', () => {
    expect(normalizeHistoryHostname('https://accounts.google.com/signup')).toBe(
      'accounts.google.com'
    )
    expect(normalizeHistoryHostname('accounts.google.com')).toBe(
      'accounts.google.com'
    )
  })
})
