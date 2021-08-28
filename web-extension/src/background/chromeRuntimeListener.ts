import { IAuth } from '@src/util/useBackground'
import { fireToken, lockTime, passwords, setPasswords } from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'

export let twoFAs: Array<IAuth> | null | undefined = undefined

let isCounting = false
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false

chrome.runtime.onMessage.addListener(function (
  req:
    | { action: BackgroundMessageType }
    | {
        action: 'lockTime' | 'auths'
        lockTime: number
        auths: any
        passwords: any
        settings: any
      },
  sender,
  sendResponse
) {
  switch (req.action) {
    case BackgroundMessageType.giveMeAuths:
      console.log('sending twoFAs', twoFAs)
      sendResponse({ auths: twoFAs })
      break

    case BackgroundMessageType.getFirebaseToken:
      console.log('fireToken in Bg script:', fireToken)
      sendResponse({ t: fireToken })
      break

    case BackgroundMessageType.wasClosed:
      console.log('isClosed', safeClosed, 'lockTime', lockTime)
      sendResponse({ wasClosed: safeClosed })
      break

    case BackgroundMessageType.giveMePasswords:
      console.log('sending passwords', passwords)
      sendResponse({ passwords: passwords })
      break

    case BackgroundMessageType.startCount:
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

    case BackgroundMessageType.lockTime:
      //@ts-expect-error
      lockTime = req.lockTime
      break

    case BackgroundMessageType.auths:
      safeClosed = false // ????? What is this why ?
      //@ts-expect-error
      twoFAs = req.auths
      console.log('was set on', twoFAs)
      break

    case BackgroundMessageType.passwords:
      //@ts-expect-error
      setPasswords(req.passwords)
      break

    case BackgroundMessageType.clear:
      twoFAs = undefined
      setPasswords([])
      break

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }
  }
})
