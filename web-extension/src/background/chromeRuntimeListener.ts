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

browser.runtime.onMessage.addListener(async function (
  req: {
    action: BackgroundMessageType
    payload: any
    lockTime: number
    config: UISettings
    auths: ITOTPSecret[]
    passwords: ILoginSecret[]
    settings: ISecuritySettings
  },
  sender
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
      if (!secret) {
        return null
      }

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
      return secret
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
      return [deviceState?.email]
    case BackgroundMessageType.getContentScriptInitialState:
      const tabUrl = tab?.url
      if (!tabUrl || !deviceState || !currentTabId) {
        return null
      } else {
        return await getContentScriptInitialState(tabUrl, currentTabId)
      }

      break

    case BackgroundMessageType.wasClosed:
      return { wasClosed: safeClosed }
      break

    case BackgroundMessageType.giveSecuritySettings:
      return {
        config: {
          vaultTime: lockTime,
          noHandsLogin: noHandsLogin
        }
      }

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
