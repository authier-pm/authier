import browser from 'webextension-polyfill'
import {
  getGmailAccountScope,
  type EmailVerificationCode
} from '../email-codes/emailCodeProtocol'

export const openEmailCodeSource = async (
  entry: EmailVerificationCode
): Promise<boolean> => {
  const source = entry.source
  const gmailTabs = await browser.tabs.query({
    url: 'https://mail.google.com/mail/*'
  })
  const matchingTabs = gmailTabs.filter((tab) => {
    const scope = getGmailAccountScope(tab.url ?? '')
    if (!scope) return false
    if (!source) return !tab.incognito
    return scope === source.accountUrl && tab.incognito === source.incognito
  })
  const tab =
    matchingTabs.find((tab) => tab.id === source?.tabId) ?? matchingTabs[0]
  if (tab?.id !== undefined) {
    // Activating a tab does not bring a different browser window to the front.
    await browser.tabs.update(tab.id, { active: true })
    if (tab.windowId !== undefined)
      await browser.windows.update(tab.windowId, { focused: true })
    return true
  }

  // The original tab may have closed or navigated away. Reopen its Gmail account,
  // without sending the code or sender address in the URL.
  const url = source?.accountUrl ?? 'https://mail.google.com/mail/'
  if (source?.incognito) {
    await browser.windows.create({ url, incognito: true, focused: true })
  } else {
    await browser.tabs.create({ url, active: true })
  }
  return true
}
