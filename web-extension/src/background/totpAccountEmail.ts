import browser from 'webextension-polyfill'
import { isTotpAccountEmail } from '@shared/totpLabel'
import { TotpEmailMessage } from '../util/totpAccountEmail'

const memorySession = new Map<string, string>()
const sessionKey = (incognito: boolean) =>
  `totpAccountEmail:${incognito ? 'private' : 'regular'}`

export const handleTotpAccountEmailMessage = (
  message: unknown,
  sender: browser.Runtime.MessageSender
): Promise<string | null> | undefined => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('kind' in message) ||
    typeof message.kind !== 'string' ||
    !message.kind.startsWith('authierTotpEmail')
  )
    return
  if (sender.id !== browser.runtime.id) return Promise.resolve(null)

  if (message.kind === TotpEmailMessage.REPORT) {
    if (
      !sender.tab ||
      !sender.url?.match(/^https?:\/\//) ||
      !('email' in message) ||
      typeof message.email !== 'string' ||
      !isTotpAccountEmail(message.email)
    )
      return Promise.resolve(null)
    const key = sessionKey(sender.tab.incognito)
    const email = message.email.trim()
    if (!browser.storage.session) {
      memorySession.set(key, email)
      return Promise.resolve(null)
    }
    return browser.storage.session.set({ [key]: email }).then(() => null)
  }

  // Only extension pages may read the fallback; never relay it to websites.
  if (
    message.kind !== TotpEmailMessage.GET ||
    !sender.url?.startsWith(browser.runtime.getURL('')) ||
    !('incognito' in message) ||
    typeof message.incognito !== 'boolean'
  ) {
    return Promise.resolve(null)
  }
  const key = sessionKey(message.incognito)
  if (!browser.storage.session)
    return Promise.resolve(memorySession.get(key) ?? null)
  return browser.storage.session.get(key).then((stored) => {
    const email: unknown = stored[key]
    return typeof email === 'string' && isTotpAccountEmail(email) ? email : null
  })
}
