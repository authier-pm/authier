import browser from 'webextension-polyfill'
import { EmailCodeMessageKind, getGmailAccountScope } from './emailCodeProtocol'
import { observeGmailCodes } from './readGmailCodes'

if (window.top === window && getGmailAccountScope(location.href)) {
  observeGmailCodes(document, (candidates) =>
    browser.runtime.sendMessage({
      kind: EmailCodeMessageKind.REPORT,
      candidates
    })
  )
}
