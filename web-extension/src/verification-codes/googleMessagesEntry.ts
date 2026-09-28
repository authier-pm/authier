import browser from 'webextension-polyfill'
import {
  CodeMessageKind,
  isGoogleMessagesUrl
} from './verificationCodeProtocol'
import { observeGoogleMessagesCodes } from './readGoogleMessagesCodes'

if (window.top === window && isGoogleMessagesUrl(location.href)) {
  observeGoogleMessagesCodes(document, (candidates) =>
    browser.runtime.sendMessage({ kind: CodeMessageKind.REPORT, candidates })
  )
}
