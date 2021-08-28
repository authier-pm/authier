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
let homeList: 'All' | 'TOTP & Login credencials' | 'Current domain' = 'All'

const timeToString = (time: number) => {
  const obj = {
    'On web close': 0,
    '10 secconds': 10000,
    '8 hours': 28800000,
    '12 hours': 43200000
  }

  Object.keys(obj).map((key) => {
    //@ts-expect-error
    if (obj[key] === time) {
      return key
    }
  })
}

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
          vaultTime: timeToString(lockTime),
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
      twoFAs = undefined
      setPasswords([])
      break

    case BackgroundMessageType.securitySettings:
      //@ts-expect-error
      if (req.settings.vaultTime === 'On web close') {
        setLockTime(0)
        //@ts-expect-error
      } else if (req.settings.vaultTime === '10 secconds') {
        setLockTime(10000)
        //@ts-expect-error
      } else if (req.settings.vaultTime === '8 hours') {
        setLockTime(1000 * 60 * 60 * 8)
        //@ts-expect-error
      } else if (req.settings.vaultTime === '12 hours') {
        setLockTime(1000 * 60 * 60 * 12)
      }

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
