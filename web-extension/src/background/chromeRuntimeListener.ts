import { ITOTPSecret, ILoginSecret } from '@src/util/useDeviceState'

import { BackgroundMessageType } from './BackgroundMessageType'

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
  SettingsInput,
  WebInputType
} from '../../../shared/generated/graphqlBaseTypes'
import { device, isRunningInBgPage } from './ExtensionDevice'
import { loginCredentialsSchema } from '../util/loginCredentialsSchema'
import { getContentScriptInitialState } from './getContentScriptInitialState'
import { IBackgroundStateSerializable } from './backgroundPage'

const log = debug('au:chListener')

if (!isRunningInBgPage) {
  throw new Error('this file should only be imported in the background page')
}

const safeClosed = false // Is safe Closed ?
export let noHandsLogin = false

interface Coord {
  x: number
  y: number
}
interface ICapturedInput {
  cssSelector: string
  domOrdinal: number
  type: 'input' | 'submit' | 'keydown'
  kind: WebInputType
  inputted: string | undefined
  domCoordinates: Coord
}

interface ILoginCredentialsFromContentScript {
  username: string
  password: string
  capturedInputEvents: ICapturedInput[]
  openInVault: boolean
}

//NOTE: temporery storage for not yet saved credentials. (during page rerender)
export const saveLoginModalsStates = new Map<
  number,
  { password: string; username: string }
>()

let capturedInputEvents: ICapturedInput[] = []

//This is for saving URL of inputs
let inputsUrl: string

let lockTimeEnd
let lockTimeStart
let lockInterval

log('background page loaded')
browser.runtime.onMessage.addListener(async function (
  req: {
    action: BackgroundMessageType
    payload: any
    lockTime: number
    auths: ITOTPSecret[]
    passwords: ILoginSecret[]
    settings: SettingsInput
    time: string
    state: IBackgroundStateSerializable
  },
  sender
) {
  const tab = sender.tab

  const currentTabId = tab?.id
  const deviceState = device.state

  log('req', req)

  switch (req.action) {
    case BackgroundMessageType.addLoginCredentials:
      if (!tab) {
        return false
      }
      const { url } = tab

      if (!url || !deviceState) {
        return false // we can't do anything without a valid url
      }
      let urlParsed: URL
      try {
        urlParsed = new URL(url)
      } catch (err) {
        return false
      }

      const credentials: ILoginCredentialsFromContentScript = req.payload

      const encryptedData = {
        username: credentials.username,
        password: credentials.password,
        iconUrl: tab.favIconUrl ?? null,
        url: inputsUrl,
        label: tab.title ?? `${credentials.username}@${urlParsed.hostname}`
      }

      loginCredentialsSchema.parse(encryptedData)

      let encrypted = await deviceState.encrypt(JSON.stringify(encryptedData))
      const [secret] = await deviceState.addSecrets([
        {
          kind: EncryptedSecretType.LOGIN_CREDENTIALS,
          loginCredentials: encryptedData,
          encrypted,
          createdAt: new Date().toJSON()
        }
      ])
      if (!secret) {
        return false
      }

      tab.id && saveLoginModalsStates.delete(tab.id)
      const webInputs = credentials.capturedInputEvents.map((captured) => {
        return {
          domPath: captured.cssSelector,
          kind: captured.kind,
          url: inputsUrl,
          domOrdinal: captured.domOrdinal,
          domCoordinates: captured.domCoordinates
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
      return true

    case BackgroundMessageType.saveCapturedInputEvents:
      log('saveCapturedInputEvents', req.payload)
      capturedInputEvents = req.payload.inputEvents
      inputsUrl = req.payload.url

      const newWebInputs = capturedInputEvents.map((captured) => {
        return {
          domPath: captured.cssSelector,
          kind: captured.kind,
          url: inputsUrl,
          domOrdinal: captured.domOrdinal,
          domCoordinates: captured.domCoordinates
        }
      })

      //Update web inputs in DB
      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs: newWebInputs
        }
      })

      return true

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
      log('GEtting initial state from BG', tab?.url, tab?.pendingUrl)
      if (!tabUrl || !deviceState || !currentTabId) {
        log(
          '~ chromeRuntimeListener We dont have tabURL or deviceState or tabId'
        )
        return null
      } else {
        //We will have to get webInputs for current URL from DB and send it to content script for reseting after new DOM path save
        return getContentScriptInitialState(tabUrl, currentTabId)
      }

    case BackgroundMessageType.getCapturedInputEvents:
      return { capturedInputEvents, inputsUrl: tab?.url }

    case BackgroundMessageType.wasClosed:
      return { wasClosed: safeClosed }

    case BackgroundMessageType.giveSecuritySettings:
      return {
        config: {
          vaultTime: device.state?.lockTime,
          noHandsLogin: noHandsLogin
        }
      }

    case BackgroundMessageType.securitySettings:
      if (deviceState) {
        deviceState.lockTime = req.settings.vaultLockTimeoutSeconds
        deviceState.syncTOTP = req.settings.syncTOTP
        deviceState.language = req.settings.language
        deviceState.autofill = req.settings.autofill
        noHandsLogin = req.settings.autofill

        //Refresh the lock interval
        lockInterval = clearInterval(lockInterval)
        lockTimeStart = Date.now()
        lockTimeEnd = lockTimeStart + deviceState.lockTime * 1000

        checkInterval(lockTimeEnd)
        deviceState.save()
      }

      return true

    case BackgroundMessageType.setLockInterval:
      if (!lockInterval) {
        lockTimeStart = Date.now()
        lockTimeEnd = lockTimeStart + parseInt(req.time) * 1000
      }
      checkInterval(lockTimeEnd)
      return true

    case BackgroundMessageType.clearLockInterval:
      resetInterval()
      return true

    case BackgroundMessageType.setDeviceState:
      device.save(req.state)
      return true

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }

      return true
  }
})

const checkInterval = (time: number) => {
  if (!lockInterval && lockTimeStart !== lockTimeEnd) {
    lockInterval = setInterval(() => {
      if (time <= Date.now()) {
        log('lock', Date.now(), device)

        resetInterval()
        device.lock()
      }
    }, 5000)
  }
}

const resetInterval = () => {
  lockTimeEnd = null
  lockTimeStart = null
  lockInterval = clearInterval(lockInterval)
}
