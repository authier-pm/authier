import { UISettings } from '@src/components/setting-screens/UI'
import { IAuth, SecuritySettings } from '@src/util/useBackground'
import {
  fireToken,
  lockTime,
  passwords,
  setLockTime,
  setPasswords
} from './backgroundPage'

export let twoFAs: Array<IAuth> | null | undefined = undefined

let isCounting = false
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false
let homeList: 'All' | 'TOTP' | 'Login credencials' | 'Current domain' = 'All'

export enum MessageType {
  giveMeAuths = 'GiveMeAuths',
  getFirebaseToken = 'getFirebaseToken',
  wasClosed = 'wasClosed',
  giveMePasswords = 'giveMePasswords',
  startCount = 'startCount',
  lockTime = 'lockTime',
  auths = 'auths',
  clear = 'clear',
  passwords = 'passwords',
  securitySettings = 'securitySettings',
  giveSecuritySettings = 'giveSecuritySettings',
  giveUISettings = 'giveUISettings',
  UISettings = 'UISettings'
}

chrome.runtime.onMessage.addListener(function (
  req:
    | { action: MessageType }
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
    case MessageType.giveMeAuths:
      console.log('sending twoFAs', twoFAs)
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
      console.log('sending passwords', passwords)
      sendResponse({ passwords: passwords })
      break

    // Maybe connect to one bog config??
    case MessageType.giveSecuritySettings:
      sendResponse({
        config: {
          vaultTime: lockTime,
          noHandsLogin: noHandsLogin
        }
      })
      break

    case MessageType.giveUISettings:
      sendResponse({
        config: {
          homeList: homeList
        }
      })

    case MessageType.startCount:
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

    case MessageType.lockTime:
      //@ts-expect-error
      lockTime = req.lockTime
      break

    case MessageType.auths:
      safeClosed = false // ????? What is this why ?
      //@ts-expect-error
      twoFAs = req.auths
      console.log('Auths set on', twoFAs)
      break

    case MessageType.passwords:
      //@ts-expect-error
      setPasswords(req.passwords)
      break

    case MessageType.clear:
      twoFAs = undefined
      setPasswords([])
      break

    case MessageType.securitySettings:
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

    case MessageType.UISettings:
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
