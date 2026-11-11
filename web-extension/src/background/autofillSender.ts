import browser from 'webextension-polyfill'

/** Only a real, same-origin document may receive the tab's autofill state. */
export const getAutofillSender = (
  sender?: browser.Runtime.MessageSender,
  documentUrl?: string
) => {
  if (
    sender?.id !== browser.runtime.id ||
    sender?.tab?.id === undefined ||
    sender.frameId === undefined ||
    !Number.isInteger(sender.frameId) ||
    sender.frameId < 0 ||
    !sender.url ||
    !sender.tab.url ||
    !URL.canParse(sender.url) ||
    !URL.canParse(sender.tab.url)
  )
    return null

  const frame = new URL(sender.url)
  const top = new URL(sender.tab.url)
  if (
    !['https:', 'http:'].includes(frame.protocol) ||
    frame.origin !== top.origin ||
    ('origin' in sender &&
      sender.origin !== undefined &&
      sender.origin !== frame.origin)
  )
    return null

  // A port keeps its connection-time URL during same-document SPA navigation.
  // A page may update its path, but it may never override its browser-known origin.
  if (documentUrl !== undefined && !URL.canParse(documentUrl)) return null
  const current = documentUrl === undefined ? frame : new URL(documentUrl)
  if (current.origin !== frame.origin) return null

  return {
    tabId: sender.tab.id,
    frameId: sender.frameId,
    url: current.href,
    documentId: sender.documentId,
    key: `${sender.tab.id}:${sender.documentId ?? sender.frameId}`
  }
}

export const isExtensionPageSender = (sender?: browser.Runtime.MessageSender) =>
  sender?.id === browser.runtime.id &&
  sender.url?.startsWith(browser.runtime.getURL('')) === true
