import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  VERIFICATION_CODE_LIFETIME_MS,
  VERIFICATION_CODE_EXPIRY_ALARM,
  VERIFICATION_CODE_STORAGE_KEY,
  CodeMessageKind,
  GOOGLE_MESSAGES_URL,
  verificationCodesSchema
} from '../verification-codes/verificationCodeProtocol'
import {
  handleVerificationCodeMessage,
  initializeVerificationCodes,
  refreshVerificationCodes,
  type RelayedVerificationCode
} from './verificationCodes'

const setBadgeText = vi.fn().mockResolvedValue(undefined)
const createAlarm = vi.fn().mockResolvedValue(undefined)
const clearAlarm = vi.fn().mockResolvedValue(true)
const updateTab = vi.fn().mockResolvedValue(undefined)
const updateWindow = vi.fn().mockResolvedValue(undefined)
const createWindow = vi.fn().mockResolvedValue(undefined)
const storage: Record<string, unknown> = {}
const popupSender = {
  id: 'test-extension',
  url: 'chrome-extension://mock-extension-id/js/popup.html'
}
const gmailSender: browser.Runtime.MessageSender = {
  id: 'test-extension',
  url: 'https://mail.google.com/mail/u/0/#inbox',
  frameId: 0,
  tab: {
    id: 7,
    active: false,
    index: 0,
    highlighted: false,
    pinned: false,
    incognito: false
  }
}
const candidate = {
  provider: 'Gmail',
  sender: 'someone@example.com',
  code: '213456'
}
const report = (code = candidate.code, sender = gmailSender) =>
  handleVerificationCodeMessage(
    { kind: CodeMessageKind.REPORT, candidates: [{ ...candidate, code }] },
    sender
  )
const list = async () =>
  verificationCodesSchema.parse(
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.LIST },
      popupSender
    )
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-16T12:00:00Z'))
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  })
  Object.assign(browser.runtime, { id: 'test-extension' })
  Object.assign(browser.tabs, { update: updateTab })
  vi.mocked(browser.tabs.query).mockResolvedValue([])
  Object.assign(browser, {
    windows: { update: updateWindow, create: createWindow },
    action: {
      setBadgeText,
      setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
      setTitle: vi.fn().mockResolvedValue(undefined)
    },
    alarms: {
      create: createAlarm,
      clear: clearAlarm,
      onAlarm: { addListener: vi.fn() }
    }
  })
  for (const key of Object.keys(storage)) delete storage[key]
  vi.mocked(browser.storage.session.get).mockImplementation(async () =>
    structuredClone(storage)
  )
  vi.mocked(browser.storage.session.set).mockImplementation(async (items) => {
    Object.assign(storage, structuredClone(items))
  })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('verification code background messages', () => {
  it('accepts a background Gmail tab, badges it, and returns only acknowledgement to the content script', async () => {
    expect(await report()).toBe(true)
    const entries = await list()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      ...candidate,
      copied: false,
      source: {
        tabId: 7,
        accountUrl: 'https://mail.google.com/mail/u/0/',
        incognito: false
      }
    })
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
    expect(createAlarm).toHaveBeenLastCalledWith(
      VERIFICATION_CODE_EXPIRY_ALARM,
      {
        when: Date.now() + VERIFICATION_CODE_LIFETIME_MS
      }
    )
    expect(browser.storage.local.set).not.toHaveBeenCalled()
  })

  it.each([
    { ...gmailSender, url: 'https://mail.google.com.evil.test/mail/u/0/' },
    { ...gmailSender, url: 'http://mail.google.com/mail/u/0/' },
    { ...gmailSender, url: 'https://example.com/' },
    { ...gmailSender, frameId: 1 },
    { ...gmailSender, id: 'another-extension' },
    { ...gmailSender, tab: undefined }
  ])('rejects an untrusted report envelope', async (sender) => {
    expect(await report('213456', sender)).toBeNull()
    expect(await list()).toEqual([])
  })

  it('does not disclose codes to Gmail or ordinary content scripts', async () => {
    await report()
    for (const kind of [
      CodeMessageKind.LIST,
      CodeMessageKind.COPIED,
      CodeMessageKind.DISMISS,
      CodeMessageKind.OPEN_SOURCE
    ]) {
      expect(
        await handleVerificationCodeMessage(
          { kind, id: (await list())[0].id },
          gmailSender
        )
      ).toBeNull()
    }
    expect((await list())[0].copied).toBe(false)
    expect(browser.tabs.query).not.toHaveBeenCalled()
  })

  it('allows popup actions after client-side routing changes its URL', async () => {
    await report()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.COPIED, id: entry.id },
      { ...popupSender, url: 'chrome-extension://mock-extension-id/' }
    )
    expect((await list())[0].copied).toBe(true)
    expect(
      await handleVerificationCodeMessage(
        { kind: CodeMessageKind.LIST },
        {
          ...popupSender,
          url: 'chrome-extension://mock-extension-id.evil/js/popup.html'
        }
      )
    ).toBeNull()
  })

  it('swallows malformed namespaced messages instead of allowing legacy relay', async () => {
    expect(
      await handleVerificationCodeMessage(
        {
          kind: CodeMessageKind.REPORT,
          candidates: [{ ...candidate, code: '<script>' }]
        },
        gmailSender
      )
    ).toBeNull()
    expect(
      await handleVerificationCodeMessage(
        { kind: 'authierVerificationCodeUnknown' },
        gmailSender
      )
    ).toBeNull()
    expect(
      handleVerificationCodeMessage({ kind: 'unrelated' }, gmailSender)
    ).toBeUndefined()
  })

  it('serializes simultaneous Gmail tab reports and deduplicates rerenders', async () => {
    await Promise.all([report(), report(), report('ABCDEFGH')])
    expect(await list()).toHaveLength(2)
    await report()
    expect(await list()).toHaveLength(2)
  })

  it('keeps identical codes from different Gmail accounts separate', async () => {
    await report()
    await report('213456', {
      ...gmailSender,
      url: 'https://mail.google.com/mail/u/1/#inbox'
    })
    expect(await list()).toHaveLength(2)
  })

  it('keeps codes from private and normal Gmail windows separate', async () => {
    await report()
    await report('213456', {
      ...gmailSender,
      tab: { ...gmailSender.tab!, id: 8, incognito: true }
    })
    expect(await list()).toHaveLength(2)
  })

  it('refreshes the source tab on duplicate reports without extending expiry or resetting copied state', async () => {
    await report()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.COPIED, id: entry.id },
      popupSender
    )
    vi.setSystemTime(Date.now() + 1000)
    await report('213456', {
      ...gmailSender,
      tab: { ...gmailSender.tab!, id: 9 }
    })
    expect(await list()).toEqual([
      { ...entry, copied: true, source: { ...entry.source, tabId: 9 } }
    ])
  })

  it('focuses the original Gmail tab and its window without acknowledging the code', async () => {
    await report()
    const [entry] = await list()
    vi.mocked(browser.tabs.query).mockResolvedValue([
      { ...gmailSender.tab!, id: 99, windowId: 1, url: gmailSender.url },
      { ...gmailSender.tab!, windowId: 12, url: gmailSender.url }
    ])
    expect(
      await handleVerificationCodeMessage(
        { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
        popupSender
      )
    ).toBe(true)
    expect(updateTab).toHaveBeenCalledWith(7, { active: true })
    expect(updateWindow).toHaveBeenCalledWith(12, { focused: true })
    expect(browser.tabs.create).not.toHaveBeenCalled()
    expect((await list())[0].copied).toBe(false)
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
  })

  it('selects another tab for the same account if the source tab changed accounts', async () => {
    await report()
    const [entry] = await list()
    vi.mocked(browser.tabs.query).mockResolvedValue([
      {
        ...gmailSender.tab!,
        windowId: 1,
        url: 'https://mail.google.com/mail/u/1/#inbox'
      },
      {
        ...gmailSender.tab!,
        id: 8,
        windowId: 2,
        url: gmailSender.url,
        incognito: true
      },
      { ...gmailSender.tab!, id: 9, windowId: 3, url: gmailSender.url }
    ])
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
      popupSender
    )
    expect(updateTab).toHaveBeenCalledWith(9, { active: true })
    expect(updateWindow).toHaveBeenCalledWith(3, { focused: true })
  })

  it('reopens the source Gmail account when it no longer has an open tab', async () => {
    await report('213456', {
      ...gmailSender,
      url: 'https://mail.google.com/mail/u/2/#inbox'
    })
    const [entry] = await list()
    vi.mocked(browser.tabs.query).mockResolvedValue([
      { ...gmailSender.tab!, url: 'https://example.com/' },
      { ...gmailSender.tab!, id: 8, url: gmailSender.url }
    ])
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
      popupSender
    )
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'https://mail.google.com/mail/u/2/',
      active: true
    })
    expect(updateTab).not.toHaveBeenCalled()
  })

  it('reopens a private source in a private window', async () => {
    await report('213456', {
      ...gmailSender,
      tab: { ...gmailSender.tab!, incognito: true }
    })
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
      popupSender
    )
    expect(createWindow).toHaveBeenCalledWith({
      url: 'https://mail.google.com/mail/u/0/',
      incognito: true,
      focused: true
    })
    expect(browser.tabs.create).not.toHaveBeenCalled()
  })

  it('does not navigate for an expired or missing code', async () => {
    await report()
    const [entry] = await list()
    vi.setSystemTime(Date.now() + VERIFICATION_CODE_LIFETIME_MS + 1)
    expect(
      await handleVerificationCodeMessage(
        { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
        popupSender
      )
    ).toBe(false)
    expect(
      await handleVerificationCodeMessage(
        { kind: CodeMessageKind.OPEN_SOURCE, id: crypto.randomUUID() },
        popupSender
      )
    ).toBe(false)
    expect(browser.tabs.query).not.toHaveBeenCalled()
    expect(browser.tabs.create).not.toHaveBeenCalled()
  })

  it('clears the badge after copying and does not notify again for the same email', async () => {
    await report()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.COPIED, id: entry.id },
      popupSender
    )
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
    await report()
    expect((await list())[0].copied).toBe(true)
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
  })

  it('keeps the badge while another code is still new', async () => {
    await report()
    await report('A1B2C3')
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.COPIED, id: entry.id },
      popupSender
    )
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
  })

  it('dismisses a code without resurrecting it on a mail tab reload', async () => {
    await report()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.DISMISS, id: entry.id },
      popupSender
    )
    await report()
    expect(await list()).toEqual([])
    expect(JSON.stringify(storage)).not.toContain(candidate.code)
  })

  it('expires code values and clears the badge and alarm', async () => {
    await report()
    vi.setSystemTime(Date.now() + VERIFICATION_CODE_LIFETIME_MS + 1)
    await refreshVerificationCodes()
    expect(await list()).toEqual([])
    expect(
      JSON.stringify(storage[VERIFICATION_CODE_STORAGE_KEY])
    ).not.toContain(candidate.code)
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
    expect(clearAlarm).toHaveBeenLastCalledWith(VERIFICATION_CODE_EXPIRY_ALARM)
    await report()
    expect(await list()).toEqual([])
  })

  it('restores badge state from session storage after a worker wake and clears it when session storage is cleared', async () => {
    await report()
    await refreshVerificationCodes()
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
    delete storage[VERIFICATION_CODE_STORAGE_KEY]
    await refreshVerificationCodes()
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
  })
})

const messagesSender: browser.Runtime.MessageSender = {
  ...gmailSender,
  url: 'https://messages.google.com/web/conversations/42',
  tab: { ...gmailSender.tab!, id: 11 }
}
const smsCandidate = {
  provider: 'Google Messages',
  sender: 'AirBank',
  code: '4742'
}
const reportSms = (sender = messagesSender, candidates = [smsCandidate]) =>
  handleVerificationCodeMessage(
    { kind: CodeMessageKind.REPORT, candidates },
    sender
  )

describe('SMS codes from Google Messages for Web', () => {
  it('accepts a Messages tab report and opens that tab without copying', async () => {
    expect(await reportSms()).toBe(true)
    const [entry] = await list()
    expect(entry).toMatchObject({
      ...smsCandidate,
      copied: false,
      source: { tabId: 11, incognito: false }
    })
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
    vi.mocked(browser.tabs.query).mockResolvedValue([
      { ...messagesSender.tab!, windowId: 4, url: messagesSender.url }
    ])
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
      popupSender
    )
    expect(browser.tabs.query).toHaveBeenCalledWith({
      url: 'https://messages.google.com/web/*'
    })
    expect(updateTab).toHaveBeenCalledWith(11, { active: true })
    expect(updateWindow).toHaveBeenCalledWith(4, { focused: true })
    expect((await list())[0].copied).toBe(false)
  })

  it('reopens Google Messages when its tab has closed', async () => {
    await reportSms()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id },
      popupSender
    )
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: GOOGLE_MESSAGES_URL,
      active: true
    })
  })

  it('never lets one web app report codes on behalf of another', async () => {
    await reportSms(gmailSender)
    await report('213456', messagesSender)
    await reportSms({
      ...messagesSender,
      url: 'https://messages.google.com.evil.test/web/conversations'
    })
    await reportSms({ ...messagesSender, url: 'https://messages.google.com/' })
    expect(await list()).toEqual([])
  })

  it('does not notify twice for the same SMS after Messages rerenders', async () => {
    await reportSms()
    await reportSms()
    expect(await list()).toHaveLength(1)
  })
})

const relayed = (
  overrides: Partial<RelayedVerificationCode> = {}
): RelayedVerificationCode => ({
  v: 1,
  id: '5c0f8c1e-6f2a-4d6e-9b1a-3f7e2d9c4b10',
  code: '474230',
  sender: 'AirBank',
  receivedAt: Date.now(),
  deviceName: 'Pixel 9',
  expiresAt: Date.now() + VERIFICATION_CODE_LIFETIME_MS,
  ...overrides
})

describe('codes relayed from Android phones', () => {
  const fetchRelayedCodes = vi.fn<() => Promise<RelayedVerificationCode[]>>()
  const sync = (sender = popupSender) =>
    handleVerificationCodeMessage(
      { kind: CodeMessageKind.SYNC_RELAYED },
      sender
    )
  beforeEach(() => {
    fetchRelayedCodes.mockReset()
    initializeVerificationCodes({ fetchRelayedCodes })
  })

  it('adds a decrypted relay once, even when the popup keeps polling', async () => {
    fetchRelayedCodes.mockResolvedValue([relayed()])
    await sync()
    await sync()
    const entries = await list()
    expect(entries).toEqual([
      expect.objectContaining({
        provider: 'Android',
        code: '474230',
        sender: 'AirBank',
        deviceName: 'Pixel 9',
        copied: false
      })
    ])
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
    expect(
      await handleVerificationCodeMessage(
        { kind: CodeMessageKind.OPEN_SOURCE, id: entries[0].id },
        popupSender
      )
    ).toBe(false)
  })

  it('only lets extension pages poll, and never stacks backend requests', async () => {
    let resolve: (codes: RelayedVerificationCode[]) => void = () => undefined
    fetchRelayedCodes.mockReturnValue(
      new Promise((resolver) => {
        resolve = resolver
      })
    )
    expect(await sync(gmailSender)).toBeNull()
    const polls = [sync(), sync()]
    resolve([relayed()])
    await Promise.all(polls)
    expect(fetchRelayedCodes).toHaveBeenCalledTimes(1)
    expect(await list()).toHaveLength(1)
  })

  it('does not resurrect a dismissed relay on the next poll', async () => {
    fetchRelayedCodes.mockResolvedValue([relayed()])
    await sync()
    const [entry] = await list()
    await handleVerificationCodeMessage(
      { kind: CodeMessageKind.DISMISS, id: entry.id },
      popupSender
    )
    await sync()
    expect(await list()).toEqual([])
    expect(JSON.stringify(storage)).not.toContain('474230')
  })

  it('expires with the server, and within the lifetime if clocks disagree', async () => {
    fetchRelayedCodes.mockResolvedValue([
      relayed({ expiresAt: Date.now() + 60_000 }),
      relayed({
        id: '7d1f2c3b-0a4e-4b5c-8d6e-9f0a1b2c3d4e',
        code: '1234',
        expiresAt: Date.now() + 3 * VERIFICATION_CODE_LIFETIME_MS
      }),
      relayed({
        id: '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091',
        code: '9999',
        expiresAt: Date.now() - 1
      })
    ])
    await sync()
    const entries = await list()
    expect(entries.map(({ code, expiresAt }) => [code, expiresAt])).toEqual([
      ['1234', Date.now() + VERIFICATION_CODE_LIFETIME_MS],
      ['474230', Date.now() + 60_000]
    ])
  })

  it('reports a failed poll to the popup without dropping existing codes', async () => {
    fetchRelayedCodes.mockResolvedValueOnce([relayed()])
    await sync()
    fetchRelayedCodes.mockRejectedValueOnce(new Error('offline'))
    await expect(sync()).rejects.toThrow('offline')
    expect(await list()).toHaveLength(1)
  })
})
