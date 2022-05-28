import {
  ITOTPSecret,
  ILoginSecret,
  ISecuritySettings
} from '@src/util/useDeviceState'
import { lockTime } from './backgroundPage'
import { BackgroundMessageType } from './BackgroundMessageType'
import { UISettings } from '@src/components/setting-screens/SettingsForm'
import browser from 'webextension-polyfill'
import debug from 'debug'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddWebInputsDocument,
  AddWebInputsMutationResult,
  AddWebInputsMutationVariables
} from './chromeRuntimeListener.codegen'
import {
  EncryptedSecretType,
  WebInputType
} from '../../../shared/generated/graphqlBaseTypes'
import { device, isRunningInBgPage } from './ExtensionDevice'
import { loginCredentialsSchema } from '../util/loginCredentialsSchema'
import { getContentScriptInitialState } from './getContentScriptInitialState'

const log = debug('au:chListener')

if (!isRunningInBgPage) {
  throw new Error('this file should only be imported in the background page')
}

const safeClosed = false // Is safe Closed ?
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

let capturedInputEvents: {
  element: string
  type: 'input' | 'submit' | 'keydown'
  kind: WebInputType
  inputted: string | undefined
}[] = []
//This is for saving URL of inputs
let inputsUrl: string

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
        return false
      }
      const { url } = tab

      if (!url || !deviceState) {
        return false // we can't do anything without a valid url
      }

      const credentials: ILoginCredentialsFromContentScript = req.payload

      const namePassPair = {
        username: credentials.username,
        password: credentials.password
      }

      loginCredentialsSchema.parse(namePassPair)

      const [secret] = await deviceState.addSecrets([
        {
          kind: EncryptedSecretType.LOGIN_CREDENTIALS,
          loginCredentials: namePassPair,
          encrypted: deviceState.encrypt(JSON.stringify(namePassPair)),
          iconUrl: tab.favIconUrl,
          url: inputsUrl,
          label: tab.title ?? `${credentials.username}@${new URL(url).hostname}`
        }
      ])
      if (!secret) {
        return false
      }

      tab.id && saveLoginModalsStates.delete(tab.id)

      const webInputs = credentials.capturedInputEvents.map((captured) => {
        return {
          domPath: captured.element,
          kind: captured.kind,
          url: inputsUrl
        }
      })

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
      return { failed: false }

    case BackgroundMessageType.saveCapturedInputEvents:
      console.log('TEST', req.payload)
      capturedInputEvents = req.payload.inputEvents
      inputsUrl = req.payload.url

      const newWebInputs = capturedInputEvents.map((captured) => {
        return {
          domPath: captured.element,
          kind: captured.kind,
          url: inputsUrl
        }
      })

      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs: newWebInputs
        }
      })

      console.log('SAVED', capturedInputEvents)
      break

    case BackgroundMessageType.addTOTPSecret:
      if (deviceState) {
        deviceState.addSecrets([req.payload])
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
      console.log(saveLoginModalsStates)
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
        return getContentScriptInitialState(tabUrl, currentTabId)
      }

      break

    case BackgroundMessageType.getCapturedInputEvents:
      return { capturedInputEvents, inputsUrl }
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
