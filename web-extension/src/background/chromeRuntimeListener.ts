import debug from 'debug'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddWebInputsDocument,
  AddWebInputsMutation,
  AddWebInputsMutationResult,
  AddWebInputsMutationVariables
} from './chromeRuntimeListener.codegen'
import {
  EncryptedSecretType,
  WebInputType
} from '@shared/generated/graphqlBaseTypes'
import { createChromeHandler } from '@capaj/trpc-browser/adapter'
import { device, isRunningInBgServiceWorker } from './ExtensionDevice'
import { getContentScriptInitialState } from './getContentScriptInitialState'
import browser from 'webextension-polyfill'

import {
  backgroundStateSerializableLockedSchema,
  capturedEventsPayloadSchema,
  encryptedDataSchema,
  loginCredentialSchema,
  loginCredentialsFromContentScriptSchema,
  settingsSchema,
  webInputElementSchema
} from './backgroundSchemas'
import { z } from 'zod'
import { openVaultTab } from '@src/AuthLinkPage'
import { tc } from './tc'
import { loggerMiddleware } from './loggerMiddleware'
import { mainWorldAutofillFunction } from '../content-script/getAllInputsIncludingShadowDom'
import { constructURL } from '@shared/urlUtils'

const log = debug('au:chListener')

if (!isRunningInBgServiceWorker) {
  throw new Error('this file should only be imported in the background page')
}

export interface ICapturedInput {
  cssSelector: string
  domOrdinal: number
  type: 'input' | 'submit' | 'keydown'
  kind: WebInputType
  inputted?: string | undefined
}

export interface ISaveLoginModalState {
  password: string
  username: string | null
}

//NOTE: temporary storage for not yet saved credentials. (during page rerender)
export const saveLoginModalsStates = new Map<number, ISaveLoginModalState>()

export const noHandsLogin = false
let capturedInputEvents: ICapturedInput[] = []
let inputsUrl: string

const tcProcedure = tc.procedure.use(loggerMiddleware)

const appRouter = tc.router({
  addLoginCredentials: tcProcedure
    .input(loginCredentialsFromContentScriptSchema)
    .mutation(async ({ ctx, input }) => {
      const tab = ctx.sender?.tab

      if (!tab) {
        return false
      }

      const deviceState = device.state

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

      const credentials = input
      log('addLoginCredentials', credentials)

      const encryptedData = {
        username: credentials.username ?? deviceState.email,
        password: credentials.password,
        iconUrl: tab.favIconUrl ?? null,
        url: urlParsed.hostname,
        label: `${credentials.username} | ${urlParsed.hostname}`
      }

      encryptedDataSchema.parse(encryptedData)

      const encrypted = await deviceState.encrypt(JSON.stringify(encryptedData))
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
          domOrdinal: captured.domOrdinal
        }
      })

      // TODO handle scenario where user has reached the limit of secrets, and the secret is not added. We should show a message to the user and remove the secret from local device
      try {
        await apolloClient.mutate<
          AddWebInputsMutationResult,
          AddWebInputsMutationVariables
        >({
          mutation: AddWebInputsDocument,
          variables: {
            webInputs
          }
        })
      } catch (err) {
        console.warn('error adding web inputs', err)
      }

      if (input.openInVault) {
        openVaultTab(`/secret/${secret.id}`)
      }
    }),
  saveCapturedInputEvents: tcProcedure
    .input(capturedEventsPayloadSchema)
    .mutation(async ({ input }) => {
      if (navigator.onLine === false) {
        console.log('ignoring saving of inputs because we are offline')
        return
      }

      capturedInputEvents = input.inputEvents
      inputsUrl = input.url

      const newWebInputs = capturedInputEvents.map((captured) => {
        return {
          domPath: captured.cssSelector,
          kind: captured.kind,
          url: inputsUrl,
          domOrdinal: captured.domOrdinal
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
        },
        errorPolicy: 'ignore'
      })
    }),
  saveLoginCredentialsModalShown: tcProcedure
    .input(loginCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      const tab = ctx.sender?.tab
      const currentTabId = tab?.id

      if (currentTabId) {
        saveLoginModalsStates.set(currentTabId, input)
      }
    }),
  hideLoginCredentialsModal: tcProcedure.mutation(async ({ ctx }) => {
    const tab = ctx.sender?.tab
    const currentTabId = tab?.id
    if (currentTabId) {
      saveLoginModalsStates.delete(currentTabId)
    }
  }),
  addTOTPInput: tcProcedure
    .input(webInputElementSchema)
    .mutation(async ({ input }) => {
      const hostname = constructURL(input.url).hostname

      const res = await apolloClient.mutate<
        AddWebInputsMutation,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs: [input]
        }
      })
      const resData = res.data?.addWebInputs[0]
      if (!resData || !hostname) {
        throw new Error('no data returned from addWebInputs')
      }
      const forDeviceState = {
        ...input,
        id: resData.id,
        createdAt: resData.createdAt,
        host: hostname
      }

      device.state?.webInputs.push(forDeviceState)
    }),
  executeMainWorldAutofillFunction: tcProcedure
    .input(
      z.array(
        loginCredentialSchema.extend({ lastUsedAt: z.string().nullable() })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const tab = ctx.sender?.tab
      if (!tab?.id) return []

      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: mainWorldAutofillFunction,
        args: [input]
      })

      return results[0]?.result || []
    }),
  getFallbackUsernames: tcProcedure.query(async () => {
    const deviceState = device.state
    log('Getting fallback usernames', deviceState?.email)
    return [deviceState?.email]
  }),
  getContentScriptInitialState: tcProcedure.query(async ({ ctx }) => {
    const tab = ctx.sender?.tab
    const currentTabId = tab?.id
    const tabUrl = tab?.url
    const deviceState = device.state

    log('GEtting initial state from BG', tab?.url, tab?.pendingUrl)
    if (!tabUrl || !deviceState || !currentTabId) {
      log(
        '~ chromeRuntimeListener We do not have tabURL or deviceState or tabId',
        {
          tabUrl,
          deviceState,
          currentTabId
        }
      )
      return null
    } else {
      //We will have to get webInputs for current URL from DB and send it to content script for resetting after new DOM path save
      return getContentScriptInitialState(tabUrl, currentTabId)
    }
  }),
  getCapturedInputEvents: tcProcedure.query(async ({ ctx }) => {
    const tab = ctx.sender?.tab
    return { capturedInputEvents, inputsUrl: tab?.url }
  }),
  securitySettings: tcProcedure
    .input(settingsSchema)
    .mutation(async ({ input }) => {
      const deviceState = device.state
      // console.log('securitySettings', input, device.state)
      if (deviceState) {
        device.setDeviceSettings(input)
      }

      return true
    }),
  setLockInterval: tcProcedure
    .input(z.object({ time: z.number() }))
    .mutation(async ({ input }) => {
      device.setLockTime(
        input.time ? Date.now() + input.time * 1000 : input.time
      )
      return true
    }),
  setDeviceState: tcProcedure
    .input(backgroundStateSerializableLockedSchema)
    .mutation(async ({ input }) => {
      device.save(input)
      return true
    })
})

export type AppRouter = typeof appRouter

createChromeHandler({
  router: appRouter,

  createContext: (ctx) => {
    return { sender: ctx.req.sender }
  },
  onError: (err) => {
    console.error('TRPC ERROR', err)
  }
})

console.log('background page loaded')

browser.runtime.onMessage.addListener((request) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const firstTabId = tabs[0].id

    if (!firstTabId) {
      return
    }
    chrome.tabs.sendMessage(firstTabId, request)
  })
})
