import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  EMAIL_CODE_LIFETIME_MS,
  EMAIL_CODE_EXPIRY_ALARM,
  EMAIL_CODE_STORAGE_KEY,
  EmailCodeMessageKind,
  emailVerificationCodesSchema
} from '../email-codes/emailCodeProtocol'
import {
  handleEmailVerificationCodeMessage,
  refreshEmailVerificationCodes
} from './emailVerificationCodes'

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
  handleEmailVerificationCodeMessage(
    { kind: EmailCodeMessageKind.REPORT, candidates: [{ ...candidate, code }] },
    sender
  )
const list = async () =>
  emailVerificationCodesSchema.parse(
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.LIST },
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
    alarms: { create: createAlarm, clear: clearAlarm }
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

describe('email verification background messages', () => {
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
    expect(createAlarm).toHaveBeenLastCalledWith(EMAIL_CODE_EXPIRY_ALARM, {
      when: Date.now() + EMAIL_CODE_LIFETIME_MS
    })
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
      EmailCodeMessageKind.LIST,
      EmailCodeMessageKind.COPIED,
      EmailCodeMessageKind.DISMISS,
      EmailCodeMessageKind.OPEN_SOURCE
    ]) {
      expect(
        await handleEmailVerificationCodeMessage(
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.COPIED, id: entry.id },
      { ...popupSender, url: 'chrome-extension://mock-extension-id/' }
    )
    expect((await list())[0].copied).toBe(true)
    expect(
      await handleEmailVerificationCodeMessage(
        { kind: EmailCodeMessageKind.LIST },
        {
          ...popupSender,
          url: 'chrome-extension://mock-extension-id.evil/js/popup.html'
        }
      )
    ).toBeNull()
  })

  it('swallows malformed namespaced messages instead of allowing legacy relay', async () => {
    expect(
      await handleEmailVerificationCodeMessage(
        {
          kind: EmailCodeMessageKind.REPORT,
          candidates: [{ ...candidate, code: '<script>' }]
        },
        gmailSender
      )
    ).toBeNull()
    expect(
      await handleEmailVerificationCodeMessage(
        { kind: 'authierEmailCodeUnknown' },
        gmailSender
      )
    ).toBeNull()
    expect(
      handleEmailVerificationCodeMessage({ kind: 'unrelated' }, gmailSender)
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.COPIED, id: entry.id },
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
      await handleEmailVerificationCodeMessage(
        { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id },
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id },
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id },
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id },
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
    vi.setSystemTime(Date.now() + EMAIL_CODE_LIFETIME_MS + 1)
    expect(
      await handleEmailVerificationCodeMessage(
        { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id },
        popupSender
      )
    ).toBe(false)
    expect(
      await handleEmailVerificationCodeMessage(
        { kind: EmailCodeMessageKind.OPEN_SOURCE, id: crypto.randomUUID() },
        popupSender
      )
    ).toBe(false)
    expect(browser.tabs.query).not.toHaveBeenCalled()
    expect(browser.tabs.create).not.toHaveBeenCalled()
  })

  it('clears the badge after copying and does not notify again for the same email', async () => {
    await report()
    const [entry] = await list()
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.COPIED, id: entry.id },
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
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.COPIED, id: entry.id },
      popupSender
    )
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
  })

  it('dismisses a code without resurrecting it on a mail tab reload', async () => {
    await report()
    const [entry] = await list()
    await handleEmailVerificationCodeMessage(
      { kind: EmailCodeMessageKind.DISMISS, id: entry.id },
      popupSender
    )
    await report()
    expect(await list()).toEqual([])
    expect(JSON.stringify(storage)).not.toContain(candidate.code)
  })

  it('expires code values and clears the badge and alarm', async () => {
    await report()
    vi.setSystemTime(Date.now() + EMAIL_CODE_LIFETIME_MS + 1)
    await refreshEmailVerificationCodes()
    expect(await list()).toEqual([])
    expect(JSON.stringify(storage[EMAIL_CODE_STORAGE_KEY])).not.toContain(
      candidate.code
    )
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
    expect(clearAlarm).toHaveBeenLastCalledWith(EMAIL_CODE_EXPIRY_ALARM)
    await report()
    expect(await list()).toEqual([])
  })

  it('restores badge state from session storage after a worker wake and clears it when session storage is cleared', async () => {
    await report()
    await refreshEmailVerificationCodes()
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '•' })
    delete storage[EMAIL_CODE_STORAGE_KEY]
    await refreshEmailVerificationCodes()
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: '' })
  })
})
