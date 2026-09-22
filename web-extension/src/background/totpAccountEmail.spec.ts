import browser from 'webextension-polyfill'
import { handleTotpAccountEmailMessage } from './totpAccountEmail'
import { TotpEmailMessage } from '../util/totpAccountEmail'

const contentSender: browser.Runtime.MessageSender = {
  id: browser.runtime.id,
  url: 'https://login.microsoft.com/',
  tab: {
    id: 17,
    index: 0,
    windowId: 1,
    active: true,
    highlighted: true,
    pinned: false,
    incognito: false
  },
  frameId: 0
}
const popupSender = {
  id: browser.runtime.id,
  url: browser.runtime.getURL('js/popup.html')
}
const read = (incognito = false) =>
  handleTotpAccountEmailMessage(
    { kind: TotpEmailMessage.GET, incognito },
    popupSender
  )
const report = (email: string, sender = contentSender) =>
  handleTotpAccountEmailMessage(
    { kind: TotpEmailMessage.REPORT, email },
    sender
  )
let stored: Record<string, unknown>

beforeEach(() => {
  stored = {}
  vi.mocked(browser.storage.session.get).mockImplementation(async () => ({
    ...stored
  }))
  vi.mocked(browser.storage.session.set).mockImplementation(async (items) => {
    Object.assign(stored, items)
  })
})

it('keeps only the latest email and survives a page navigation', async () => {
  await report('first@example.com')
  await report('last@example.com', {
    ...contentSender,
    url: 'https://another.example.com/'
  })
  expect(await read()).toBe('last@example.com')
  expect(Object.keys(stored)).toHaveLength(1)
  stored = {} // A new browser session has no previous email.
  expect(await read()).toBeNull()
})

it('separates regular and private sessions', async () => {
  await report('regular@example.com')
  await report('private@example.com', {
    ...contentSender,
    tab: { ...contentSender.tab!, incognito: true }
  })
  expect(await read()).toBe('regular@example.com')
  expect(await read(true)).toBe('private@example.com')
})

it('rejects malformed reports and does not expose the email to content scripts', async () => {
  await report('account@example.com')
  await report('not an email')
  await report('spoofed@example.com', {
    ...contentSender,
    id: 'another-extension'
  })
  expect(await read()).toBe('account@example.com')
  expect(
    await handleTotpAccountEmailMessage(
      { kind: TotpEmailMessage.GET, incognito: false },
      contentSender
    )
  ).toBeNull()
  expect(
    handleTotpAccountEmailMessage({ kind: 'unrelated' }, contentSender)
  ).toBeUndefined()
})
