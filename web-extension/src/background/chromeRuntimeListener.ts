import {
  ITOTPSecret,
  ILoginSecret,
  ISecuritySettings
} from '@src/util/useDeviceState'
import { lockTime } from './backgroundPage'
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
import { device, isRunningInBgPage } from './ExtensionDevice'
import { loginCredentialsSchema } from '../util/loginCredentialsSchema'
import type { IInitStateRes } from '@src/content-script/contentScript'
import { getContentScriptInitialState } from './getContentScriptInitialState'

const log = debug('au:chListener')

if (!isRunningInBgPage) {
  throw new Error('this file should only be imported in the background page')
}

let safeClosed = false // Is safe Closed ?
export let noHandsLogin = false

interface ILoginCredentialsFromContentScript {
  username: string
  password: string
  capturedInputEvents: {
    element: string
    type: 'input' | 'submit' | 'keydown'
    kind: WebInputType
    inputted: string | undefined
  }[]
  openInVault: boolean
}

export const saveLoginModalsStates = new Map<
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
  log(req)

  const tab = sender.tab

  const currentTabId = tab?.id
  const deviceState = device.state

  switch (req.action) {
    case BackgroundMessageType.addLoginCredentials:
      if (!tab) {
        return
      }
      const { url } = tab

      if (!url || !deviceState) {
        return // we can't do anything without a valid url
      }
      log('addLoginCredentials', req.payload)
      const credentials: ILoginCredentialsFromContentScript = req.payload

      const namePassPair = {
        username: credentials.username,
        password: credentials.password
      }

      loginCredentialsSchema.parse(namePassPair)

      const secret = await deviceState.addSecret({
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        loginCredentials: namePassPair,
        encrypted: deviceState.encrypt(JSON.stringify(namePassPair)),
        iconUrl: tab.favIconUrl,
        url: url,
        label: tab.title ?? `${credentials.username}@${new URL(url).hostname}`
      })

      tab.id && saveLoginModalsStates.delete(tab.id)

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

      if (req.payload.openInVault) {
        browser.tabs.create({ url: `vault.html#/secret/${secret.id}` })
      }
      sendResponse(secret)
      break
    case BackgroundMessageType.addTOTPSecret:
      if (deviceState) {
        deviceState.addSecret(req.payload as ITOTPSecret)
      }
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

    case BackgroundMessageType.addTOTPInput:
      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs: [req.payload]
        }
      })
      break
    case BackgroundMessageType.getFallbackUsernames:
      sendResponse([deviceState?.email])
      break
    case BackgroundMessageType.getContentScriptInitialState:
      const tabUrl = tab?.url
      if (!tabUrl || !deviceState || !currentTabId) {
        return sendResponse(null)
      } else {
        sendResponse(await getContentScriptInitialState(tabUrl, currentTabId))
      }

      break

    case BackgroundMessageType.wasClosed:
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

    case BackgroundMessageType.securitySettings:
      if (deviceState) {
        deviceState.lockTime = req.settings.vaultLockTime
        deviceState.save()
      }
      noHandsLogin = req.settings.noHandsLogin

      console.log('config set on:', req.settings, lockTime, noHandsLogin)
      break

    case BackgroundMessageType.UISettings:
      // homeList = req.config.homeList

      console.log('UIconfig', req.config)
      break

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }

      return true
  }
})

// /**
//  * when user open popup we clear the vault lock interval, when user closes it we always restart it again
//  */
// browser.runtime.onConnect.addListener(function (externalPort) {
//   externalPort.onDisconnect.addListener(function () {
//     console.log('onDisconnect')
//     // Do stuff that should happen when popup window closes here
//     if (vaultLockInterval) {
//       clearInterval(vaultLockInterval)
//     }
//     vaultLockInterval = setTimeout(() => {
//       vaultLockInterval && clearTimeout(vaultLockInterval)

//       safeClosed = true

//       chrome.runtime.sendMessage({ safe: 'closed' })
//       console.log('locked', safeClosed)
//     }, lockTime)
//   })

//   if (vaultLockInterval) {
//     clearTimeout(vaultLockInterval)
//     vaultLockInterval = null
//   }
// })
