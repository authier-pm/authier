import browser from 'webextension-polyfill'
import {
  CodeMessageKind,
  getGmailAccountScope
} from './verificationCodeProtocol'
import { observeGmailCodes } from './readGmailCodes'

if (window.top === window && getGmailAccountScope(location.href)) {
  observeGmailCodes(document, (candidates) =>
    browser.runtime.sendMessage({ kind: CodeMessageKind.REPORT, candidates })
  )
}
