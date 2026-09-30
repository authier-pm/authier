import browser from 'webextension-polyfill'
import {
  GOOGLE_MESSAGES_URL,
  getGmailAccountScope,
  isGoogleMessagesUrl,
  type VerificationCode
} from '../verification-codes/verificationCodeProtocol'

const focusOrOpen = async ({
  matchPattern,
  matches,
  preferredTabId,
  url,
  incognito
}: {
  matchPattern: string
  matches: (tab: browser.Tabs.Tab) => boolean
  preferredTabId?: number
  url: string
  incognito: boolean
}) => {
  const matchingTabs = (await browser.tabs.query({ url: matchPattern })).filter(
    (tab) => tab.incognito === incognito && matches(tab)
  )
  const tab =
    matchingTabs.find((tab) => tab.id === preferredTabId) ?? matchingTabs[0]
  if (tab?.id !== undefined) {
    // Activating a tab does not bring a different browser window to the front.
    await browser.tabs.update(tab.id, { active: true })
    if (tab.windowId !== undefined)
      await browser.windows.update(tab.windowId, { focused: true })
    return true
  }

  // The original tab may have closed or navigated away. Reopen the web app,
  // without sending the code or sender in the URL.
  if (incognito) {
    await browser.windows.create({ url, incognito: true, focused: true })
  } else {
    await browser.tabs.create({ url, active: true })
  }
  return true
}

export const openCodeSource = async (
  entry: VerificationCode
): Promise<boolean> => {
  if (entry.provider === 'Android') return false
  if (entry.provider === 'Google Messages') {
    return focusOrOpen({
      matchPattern: 'https://messages.google.com/web/*',
      matches: (tab) => isGoogleMessagesUrl(tab.url ?? ''),
      preferredTabId: entry.source?.tabId,
      url: GOOGLE_MESSAGES_URL,
      incognito: entry.source?.incognito ?? false
    })
  }
  const source = entry.source
  return focusOrOpen({
    matchPattern: 'https://mail.google.com/mail/*',
    matches: (tab) => {
      const scope = getGmailAccountScope(tab.url ?? '')
      return scope !== null && (!source || scope === source.accountUrl)
    },
    preferredTabId: source?.tabId,
    url: source?.accountUrl ?? 'https://mail.google.com/mail/',
    incognito: source?.incognito ?? false
  })
}
