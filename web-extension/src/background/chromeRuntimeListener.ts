import { IAuth } from '@src/util/useBackground'
import {
  fireToken,
  lockTime,
  passwords,
  setLockTime,
  setPasswords
} from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'

export let twoFAs: Array<IAuth> | null | undefined = undefined

let isCounting = false
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false
let homeList: 'All' | 'TOTP & Login credentials' | 'Current domain' = 'All'

export const timeObject: any = {
  'On web close': 0,
  '10 secconds': 10000,
  '8 hours': 288000000,
  '12 hours': 43200000
}

export let timeToString = (time: number) => {
  return Object.keys(timeObject).find((key) => {
    if (timeObject[key] === time) {
      return timeObject[key]
    }
  })
}

//Work on saving settings to DB

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

    case BackgroundMessageType.giveSecuritySettings:
      sendResponse({
        config: {
          vaultTime: lockTime,
          noHandsLogin: noHandsLogin
        }
      })
      break

    case BackgroundMessageType.giveUISettings:
      sendResponse({
        config: {
          homeList: homeList
        }
      })

    case BackgroundMessageType.startCount:
      if (lockTime !== 1000 * 60 * 60 * 8 && isCounting) {
        isCounting = false
      }
      if (!isCounting) {
        isCounting = true
        let interval = setTimeout(() => {
          clearTimeout(interval)
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
      console.log('Auths set on', twoFAs)
      break

    case BackgroundMessageType.passwords:
      //@ts-expect-error
      setPasswords(req.passwords)
      break

    case BackgroundMessageType.clear:
      twoFAs = null
      setPasswords(null)
      break

    case BackgroundMessageType.securitySettings:
      //@ts-expect-error
      setLockTime(timeObject[req.settings.vaultTime])
      //@ts-expect-error
      noHandsLogin = req.settings.noHandsLogin
      //@ts-expect-error
      console.log('config set on:', req.settings, lockTime, noHandsLogin)
      break

    case BackgroundMessageType.UISettings:
      //@ts-expect-error
      homeList = req.config.homeList
      //@ts-expect-error
      console.log('UIconfig', req.config)
      break

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }
  }
})
