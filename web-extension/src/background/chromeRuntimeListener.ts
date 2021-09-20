import {
  ITOTPSecret,
  ILoginCredentials,
  SecuritySettings
} from '@src/util/useBackgroundState'
import {
  fireToken,
  lockTime,
  passwords,
  setLockTime,
  setPasswords
} from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'
import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'
import browser from 'webextension-polyfill'

export let twoFAs: Array<ITOTPSecret> | null | undefined = undefined

let vaultLockInterval: NodeJS.Timeout | null = null
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false
let homeList: UIOptions

//Work on saving settings to DB

chrome.runtime.onMessage.addListener(function (
  req: {
    action: BackgroundMessageType
    lockTime: number
    config: UISettings
    auths: ITOTPSecret[]
    passwords: ILoginCredentials[]
    settings: SecuritySettings
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

    case BackgroundMessageType.auths:
      safeClosed = false // ????? What is this why ?

      twoFAs = req.auths
      console.log('Auths set on', twoFAs)
      break

    case BackgroundMessageType.passwords:
      setPasswords(req.passwords)
      break

    case BackgroundMessageType.clear:
      twoFAs = null
      setPasswords(null)
      break

    case BackgroundMessageType.securitySettings:
      setLockTime(req.settings.vaultLockTime)

      noHandsLogin = req.settings.noHandsLogin

      console.log('config set on:', req.settings, lockTime, noHandsLogin)
      break

    case BackgroundMessageType.UISettings:
      homeList = req.config.homeList

      console.log('UIconfig', req.config)
      break

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }
  }
})

/**
 * when user open popup we clear the vault lock interval, when user closes it we always restart it again
 */
browser.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function () {
    console.log('onDisconnect')
    // Do stuff that should happen when popup window closes here
    if (vaultLockInterval) {
      clearInterval(vaultLockInterval)
    }
    vaultLockInterval = setTimeout(() => {
      vaultLockInterval && clearTimeout(vaultLockInterval)

      safeClosed = true
      twoFAs = null
      chrome.runtime.sendMessage({ safe: 'closed' })
      console.log('locked', safeClosed)
    }, lockTime)
  })

  if (vaultLockInterval) {
    clearTimeout(vaultLockInterval)
    vaultLockInterval = null
  }
})
