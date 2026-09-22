import browser from 'webextension-polyfill'
import { isTotpAccountEmail } from '@shared/totpLabel'

export const TotpEmailMessage = {
  REPORT: 'authierTotpEmailReport',
  GET: 'authierTotpEmailGet',
  PAGE: 'authierTotpEmailPage'
} as const

export const resolveTotpAccountEmail = async (
  qrEmail: string | undefined,
  tab: { id?: number; incognito?: boolean }
) => {
  if (qrEmail) return qrEmail

  // A tab opened before the extension was installed may have no content script.
  const pageEmail: unknown =
    tab.id === undefined
      ? undefined
      : await browser.tabs
          .sendMessage(tab.id, { kind: TotpEmailMessage.PAGE }, { frameId: 0 })
          .then(
            (email: unknown) => email,
            () => undefined
          )
  if (typeof pageEmail === 'string' && isTotpAccountEmail(pageEmail)) {
    return pageEmail.trim()
  }

  const sessionEmail: unknown = await browser.runtime.sendMessage({
    kind: TotpEmailMessage.GET,
    incognito: tab.incognito ?? false
  })
  if (typeof sessionEmail === 'string' && isTotpAccountEmail(sessionEmail)) {
    return sessionEmail.trim()
  }
}
