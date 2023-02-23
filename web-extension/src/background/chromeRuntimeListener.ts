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
} from '@shared/generated/graphqlBaseTypes'
import { createChromeHandler } from 'trpc-chrome/adapter'
import { device, isRunningInBgPage } from './ExtensionDevice'
import { getContentScriptInitialState } from './getContentScriptInitialState'

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

const log = debug('au:chListener')

if (!isRunningInBgPage) {
  throw new Error('this file should only be imported in the background page')
}

interface Coord {
  x: number
  y: number
}
export interface ICapturedInput {
  cssSelector: string
  domOrdinal: number
  type: 'input' | 'submit' | 'keydown'
  kind: WebInputType
  inputted?: string | undefined
  domCoordinates: Coord
}

interface ILoginCredentialsFromContentScript {
  username: string
  password: string
  capturedInputEvents: ICapturedInput[]
  openInVault: boolean
}

//NOTE: temporary storage for not yet saved credentials. (during page rerender)
export const saveLoginModalsStates = new Map<
  number,
  { password: string; username: string }
>()

export let noHandsLogin = false
let capturedInputEvents: ICapturedInput[] = []
let inputsUrl: string
let lockTimeEnd: number | null
let lockTimeStart: number | null
let lockInterval: any

const tcProcedure = tc.procedure.use(loggerMiddleware)

const appRouter = tc.router({
  addLoginCredentials: tcProcedure
    .input(loginCredentialsFromContentScriptSchema)
    .mutation(async ({ ctx, input }) => {
      // @ts-expect-error
      const tab = ctx.sender.tab

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

      const credentials: ILoginCredentialsFromContentScript = input
      log('addLoginCredentials', credentials)

      const encryptedData = {
        username: credentials.username,
        password: credentials.password,
        iconUrl: tab.favIconUrl ?? null,
        url: url,
        label: tab.title ?? `${credentials.username}@${urlParsed.hostname}`
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
          domOrdinal: captured.domOrdinal,
          domCoordinates: captured.domCoordinates
        }
      })

      // TODO handle scenario where user has reached the limit of secrets, and the secret is not added. We should show a message to the user and remove the secret from local device
      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs
        }
      })

      if (input.openInVault) {
        openVaultTab(`/secret/${secret.id}`)
      }
    }),
  saveCapturedInputEvents: tcProcedure
    .input(capturedEventsPayloadSchema)
    .mutation(async ({ input }) => {
      capturedInputEvents = input.inputEvents
      inputsUrl = input.url

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
    }),
  saveLoginCredentialsModalShown: tcProcedure
    .input(loginCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      // @ts-expect-error
      const tab = ctx.sender.tab
      const currentTabId = tab.id

      if (currentTabId) {
        saveLoginModalsStates.set(currentTabId, input)
      }
    }),
  hideLoginCredentialsModal: tcProcedure.mutation(async ({ ctx }) => {
    // @ts-expect-error
    const tab = ctx.sender.tab
    const currentTabId = tab.id
    if (currentTabId) {
      saveLoginModalsStates.delete(currentTabId)
    }
  }),
  addTOTPInput: tcProcedure
    .input(webInputElementSchema)
    .mutation(async ({ input }) => {
      await apolloClient.mutate<
        AddWebInputsMutationResult,
        AddWebInputsMutationVariables
      >({
        mutation: AddWebInputsDocument,
        variables: {
          webInputs: [input]
        }
      })
    }),
  getFallbackUsernames: tcProcedure.query(async () => {
    const deviceState = device.state
    log('Getting fallback usernames', deviceState?.email)
    return [deviceState?.email]
  }),
  getContentScriptInitialState: tcProcedure.query(async ({ ctx }) => {
    // @ts-expect-error
    const tab = ctx.sender.tab
    const currentTabId = tab.id
    const tabUrl = tab?.url
    const deviceState = device.state

    log('GEtting initial state from BG', tab?.url, tab?.pendingUrl)
    if (!tabUrl || !deviceState || !currentTabId) {
      log(
        '~ chromeRuntimeListener We dont have tabURL or deviceState or tabId',
        {
          tabUrl,
          deviceState,
          currentTabId
        }
      )
      return null
    } else {
      //We will have to get webInputs for current URL from DB and send it to content script for reseting after new DOM path save
      return getContentScriptInitialState(tabUrl, currentTabId)
    }
  }),
  getCapturedInputEvents: tcProcedure.query(async ({ ctx }) => {
    // @ts-expect-error
    const tab = ctx.sender.tab
    return { capturedInputEvents, inputsUrl: tab?.url }
  }),
  securitySettings: tcProcedure
    .input(settingsSchema)
    .mutation(async ({ input }) => {
      const deviceState = device.state
      log('securitySettings', input, device.state)
      if (deviceState) {
        deviceState.lockTime = input.vaultLockTimeoutSeconds
        deviceState.syncTOTP = input.syncTOTP
        deviceState.language = input.language
        deviceState.autofill = input.autofill
        noHandsLogin = input.autofill

        //Refresh the lock interval
        lockInterval = clearInterval(lockInterval)
        lockTimeStart = Date.now()
        lockTimeEnd = lockTimeStart + deviceState.lockTime * 1000

        checkInterval(lockTimeEnd)
        deviceState.save()
        log('device.state', device.state)
      }

      return true
    }),
  setLockInterval: tcProcedure
    .input(z.object({ time: z.number() }))
    .mutation(async ({ input }) => {
      if (!lockInterval) {
        lockTimeStart = Date.now()
        lockTimeEnd = lockTimeStart + input.time * 1000
      }
      checkInterval(lockTimeEnd)
      return true
    }),
  clearLockInterval: tcProcedure.mutation(async () => {
    resetInterval()
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

log('background page loaded')

const checkInterval = (time: number | null) => {
  if (!lockInterval && lockTimeStart !== lockTimeEnd) {
    lockInterval = setInterval(() => {
      if (time && time <= Date.now()) {
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
