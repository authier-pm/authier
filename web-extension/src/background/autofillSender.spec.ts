import browser from 'webextension-polyfill'
import { getAutofillSender, isExtensionPageSender } from './autofillSender'

const sender = (
  patch: Partial<browser.Runtime.MessageSender> = {}
): browser.Runtime.MessageSender => ({
  id: browser.runtime.id,
  url: 'https://example.com/login',
  origin: 'https://example.com',
  frameId: 0,
  tab: {
    id: 9,
    url: 'https://example.com/login',
    index: 0,
    active: true,
    highlighted: true,
    pinned: false,
    incognito: false
  },
  ...patch
})

it('allows top documents and same-origin frames, selecting the frame URL', () => {
  expect(getAutofillSender(sender())?.url).toBe('https://example.com/login')
  expect(
    getAutofillSender(
      sender({ frameId: 7, url: 'https://example.com/embedded' })
    )
  ).toMatchObject({ tabId: 9, frameId: 7, url: 'https://example.com/embedded' })
})

it.each([
  {
    frameId: 1,
    url: 'https://unrelated.test/login',
    origin: 'https://unrelated.test'
  },
  {
    frameId: 1,
    url: 'https://example.com:8443/login',
    origin: 'https://example.com:8443'
  },
  { frameId: 1, origin: 'null' },
  { url: undefined },
  { url: 'about:blank' },
  { frameId: undefined },
  { frameId: -1 },
  { id: 'another-extension' },
  { tab: undefined }
])('rejects untrusted or incomplete sender metadata: %j', (patch) => {
  expect(getAutofillSender(sender(patch))).toBeNull()
})

it('restricts vault/session mutations to extension documents', () => {
  expect(isExtensionPageSender(sender())).toBe(false)
  expect(
    isExtensionPageSender(
      sender({ url: browser.runtime.getURL('js/popup.html') })
    )
  ).toBe(true)
  expect(
    isExtensionPageSender(
      sender({ id: 'foreign', url: browser.runtime.getURL('js/popup.html') })
    )
  ).toBe(false)
})

it('allows SPA path changes without allowing the page to claim a different origin', () => {
  expect(
    getAutofillSender(sender(), 'https://example.com/next-step')?.url
  ).toBe('https://example.com/next-step')
  expect(getAutofillSender(sender(), 'https://another.test/login')).toBeNull()
})
