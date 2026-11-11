import browser from 'webextension-polyfill'
import {
  getAutofillSender,
  isExtensionPageSender,
  isSecureContextUrl
} from './autofillSender'

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

it('keys page state by document, and by origin where there is no document id', () => {
  // Firefox gives no documentId, so a tab's top-level documents share frame 0.
  const topDocumentKey = (url: string) =>
    getAutofillSender(
      sender({
        url,
        origin: new URL(url).origin,
        tab: { ...sender().tab!, url }
      })
    )?.key

  expect(topDocumentKey('https://example.com/welcome')).toBe(
    topDocumentKey('https://example.com/login')
  )
  expect(topDocumentKey('http://example.com/login')).not.toBe(
    topDocumentKey('https://example.com/login')
  )
  expect(topDocumentKey('https://unrelated.test/login')).not.toBe(
    topDocumentKey('https://example.com/login')
  )
  expect(
    getAutofillSender(sender({ documentId: 'next-document' }))?.key
  ).not.toBe(getAutofillSender(sender({ documentId: 'login-document' }))?.key)
})

it.each([
  'https://example.com/login',
  'http://localhost:3000/login',
  'http://127.0.0.1:8080/',
  'http://127.1/'
])('treats %s as a secure context', (url) => {
  expect(isSecureContextUrl(url)).toBe(true)
})

it.each([
  'http://example.com/login',
  'http://192.168.1.1/',
  'http://[::1]:5173/',
  'http://localhost.example.com/',
  'http://127.0.0.1.nip.io/',
  'file:///home/alex/login.html',
  'about:blank',
  'not a url'
])('does not treat %s as a secure context', (url) => {
  expect(isSecureContextUrl(url)).toBe(false)
})
