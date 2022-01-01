import {
  ITOTPSecret,
  ILoginSecret,
  ISecuritySettings
} from '@src/util/useBackgroundState'
import {
  bgState,
  clearBgState,
  fireToken,
  setBgState,
  lockTime,
  setLockTime
} from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'
import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'
import browser from 'webextension-polyfill'
import debug from 'debug'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddWebInputsDocument,
  AddWebInputsMutationFn,
  AddWebInputsMutationResult,
  AddWebInputsMutationVariables
} from './chromeRuntimeListener.codegen'
import {
  EncryptedSecretType,
  WebInputType
} from '../../../shared/generated/graphqlBaseTypes'

const log = debug('chromeRuntimeListener')

let vaultLockInterval: NodeJS.Timeout | null = null
let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false
let homeList: UIOptions
let masterPassword: string

interface ILoginCredentialsFromContentScript {
  username: string
  password: string
  capturedInputEvents: {
    element: string
    type: 'input' | 'submit' | 'keydown'
    kind: WebInputType
    inputted: string | undefined
  }[]
}

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
    passwords: ILoginSecret[]
    settings: ISecuritySettings
  },
  sender,
  sendResponse
) {
  if (req.payload) {
    log(req.action, req.payload)
  } else {
    log(req.action)
  }

  const tab = sender.tab

  const currentTabId = tab?.id

  switch (req.action) {
    case BackgroundMessageType.getBackgroundState:
      console.log('get backgroundState', bgState)

      sendResponse({
        backgroundState: bgState
      })
      break
    case BackgroundMessageType.addLoginCredentials:
      if (!tab) {
        return
      }
      const { url } = tab

      if (!url || !bgState) {
        return // we can't do anything without a valid url
      }
      log('addLoginCredentials', req.payload)
      const credentials: ILoginCredentialsFromContentScript = req.payload

      const namePassPair = {
        username: credentials.username,
        password: credentials.password
      }
      bgState.addSecretOnBackend({
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        loginCredentials: namePassPair,
        encrypted: bgState.encrypt(JSON.stringify(namePassPair)),
        iconUrl: tab.favIconUrl,
        url: url,
        label: tab.title ?? `${credentials.username}@${new URL(url).hostname}`
      })

      const webInputs = credentials.capturedInputEvents.map((captured) => {
        return {
          domPath: captured.element,
          kind: captured.kind,
          url: url
        }
      })
      log('webInputs', webInputs)
      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs
        }
      })

      console.log(credentials.capturedInputEvents)
      break
    case BackgroundMessageType.addTOTPSecret:
      if (bgState) {
        bgState.addSecretOnBackend(req.payload as ITOTPSecret)
      }
    case BackgroundMessageType.saveLoginCredentialsModalShown:
      if (currentTabId) {
        saveLoginModalsStates.set(currentTabId, req.payload)
      }

      break
    case BackgroundMessageType.setBackgroundState:
      await setBgState(req.payload)
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

    case BackgroundMessageType.giveSecuritySettings:
      sendResponse({
        config: {
          vaultTime: lockTime,
          noHandsLogin: noHandsLogin
        }
      })
      break

    case BackgroundMessageType.clear:
      clearBgState()
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

      return true
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

      clearBgState()
      chrome.runtime.sendMessage({ safe: 'closed' })
      console.log('locked', safeClosed)
    }, lockTime)
  })

  if (vaultLockInterval) {
    clearTimeout(vaultLockInterval)
    vaultLockInterval = null
  }
})
