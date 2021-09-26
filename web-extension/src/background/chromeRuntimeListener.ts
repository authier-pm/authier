import {
  ITOTPSecret,
  ILoginCredentials,
  ISecuritySettings
} from '@src/util/useBackgroundState'
import {
  fireToken,
  lockTime,
  loginCredentials,
  setLockTime,
  setLoginCredentials,
  setTOTPSecrets,
  TOTPSecrets
} from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'
import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'
import browser from 'webextension-polyfill'
import debug from 'debug'

const log = debug('chromeRuntimeListener')

let vaultLockInterval: NodeJS.Timeout | null = null
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false
let homeList: UIOptions

const saveLoginModalsStates = new Map<
  number,
  { password: string; username: string }
>()

chrome.runtime.onMessage.addListener(async function (
  req: {
    action: BackgroundMessageType
    payload: any
    lockTime: number
    config: UISettings
    auths: ITOTPSecret[]
    passwords: ILoginCredentials[]
    settings: ISecuritySettings
  },
  sender,
  sendResponse
) {
  if (req.payload) {
    log('payload', req.payload)
  } else {
    log(req.action)
  }

  const currentTabId = sender.tab?.id

  switch (req.action) {
    case BackgroundMessageType.giveMeAuths:
      console.log('sending twoFAs', TOTPSecrets)
      sendResponse({ auths: TOTPSecrets })
      break
    case BackgroundMessageType.saveLoginCredentials:
      console.log('saveLoginCredentials', req.payload)

      break
    case BackgroundMessageType.saveLoginCredentialsModalShown:
      if (currentTabId) {
        saveLoginModalsStates.set(currentTabId, req.payload)
      }

      break
    case BackgroundMessageType.hideLoginCredentialsModal:
      if (currentTabId) {
        saveLoginModalsStates.delete(currentTabId)
      }

      break

    case BackgroundMessageType.getLoginCredentialsModalState:
      if (currentTabId && saveLoginModalsStates.has(currentTabId)) {
        sendResponse(saveLoginModalsStates.get(currentTabId))
      }

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
      console.log('sending passwords', loginCredentials)
      sendResponse({ passwords: loginCredentials })
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

      setTOTPSecrets(req.auths)
      console.log('Auths set on', TOTPSecrets)
      break

    case BackgroundMessageType.passwords:
      setLoginCredentials(req.passwords)
      break

    case BackgroundMessageType.clear:
      setLoginCredentials([])
      setTOTPSecrets([])
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

      setLoginCredentials([])

      setTOTPSecrets([])
      chrome.runtime.sendMessage({ safe: 'closed' })
      console.log('locked', safeClosed)
    }, lockTime)
  })

  if (vaultLockInterval) {
    clearTimeout(vaultLockInterval)
    vaultLockInterval = null
  }
})
