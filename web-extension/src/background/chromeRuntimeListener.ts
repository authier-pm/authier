import { IAuth } from '@src/util/useBackground'
import { fireToken, lockTime } from './backgroundPage'

export let twoFAs: Array<IAuth> | null | undefined = undefined

let isCounting = false
let safeClosed = false // Is safe Closed ?

export enum MessageType {
  giveMeAuths = 'GiveMeAuths',
  getFirebaseToken = 'getFirebaseToken',
  wasClosed = 'wasClosed',
  giveMePasswords = 'giveMePasswords',
  startCount = 'startCount',
  lockTime = 'lockTime',
  auths = 'auths'
}

chrome.runtime.onMessage.addListener(function (
  req:
    | { action: MessageType }
    | { action: 'lockTime' | 'auths'; lockTime: number; auths: any },
  sender,
  sendResponse
) {
  switch (req.action) {
    case MessageType.giveMeAuths:
      console.log('sending', twoFAs)
      sendResponse({ auths: twoFAs })
      break

    case MessageType.getFirebaseToken:
      console.log('fireToken in Bg script:', fireToken)
      sendResponse({ t: fireToken })
      break

    case MessageType.wasClosed:
      console.log('isClosed', safeClosed, 'lockTime', lockTime)
      sendResponse({ wasClosed: safeClosed })
      break

    case MessageType.giveMePasswords:
      console.log('test', req)
      break

    case MessageType.startCount:
      if (lockTime !== 1000 * 60 * 60 * 8 && isCounting) {
        isCounting = false
      }
      if (!isCounting) {
        isCounting = true
        setTimeout(() => {
          isCounting = false
          safeClosed = true
          twoFAs = null
          chrome.runtime.sendMessage({ safe: 'closed' })
          console.log('locked', safeClosed)
        }, lockTime)
        sendResponse({ isCounting: true })
      }
      break

    case MessageType.lockTime:
      //@ts-expect-error
      lockTime = req.lockTime
      break

    case MessageType.auths:
      safeClosed = false // ????? What is this why ?

      //@ts-expect-error
      twoFAs = req.auths

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }
  }
})
