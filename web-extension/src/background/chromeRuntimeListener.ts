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
import { initTRPC } from '@trpc/server'
import { createChromeHandler } from 'trpc-chrome/adapter'
import { device, isRunningInBgPage } from './ExtensionDevice'
import { getContentScriptInitialState } from './getContentScriptInitialState'
import { z } from 'zod'

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

//ERROR:
const capturedInputSchema = z.object({
  cssSelector: z.string().min(1),
  domOrdinal: z.number(),
  type: z.union([
    z.literal('input'),
    z.literal('submit'),
    z.literal('keydown')
  ]),
  kind: z.nativeEnum(WebInputType),
  inputted: z.string().optional(),
  domCoordinates: z.object({ x: z.number(), y: z.number() })
})

const contextScriptContextSchema = z.object({
  capturedInputEvents: z.array(capturedInputSchema),
  openInVault: z.boolean()
})

const loginCredentialSchema = z.object({
  username: z.string(),
  password: z.string()
})

const testSchema = z.object({
  capturedInputEvents: z.array(capturedInputSchema),
  openInVault: z.boolean(),
  username: z.string(),
  password: z.string()
})

const loginCredentialsFromContentScriptSchema =
  contextScriptContextSchema.extend({
    username: z.string(),
    password: z.string()
  })

const testData = {
  capturedInputEvents: [
    {
      cssSelector: 'input#JmenoUzivatele',
      domOrdinal: 0,
      type: 'input',
      kind: 'USERNAME_OR_EMAIL',
      inputted: 'spac.petr',
      domCoordinates: {
        x: 1093.25,
        y: 204
      }
    },
    {
      cssSelector: 'input#HesloUzivatele',
      domOrdinal: 0,
      type: 'input',
      kind: 'PASSWORD',
      inputted: 'n2a4RV33',
      domCoordinates: {
        x: 1093.25,
        y: 239
      }
    }
  ],
  openInVault: false,
  username: 'spac.petr',
  password: 'n2a4RV33'
}
const lol = testSchema.parse(testData)
console.log('HAHAHAHAH', lol)
//ERROR

const encryptedDataSchema = loginCredentialSchema.extend({
  iconUrl: z.string().nullable(),
  url: z.string(),
  label: z.string() 
})

const capturedEventsPayloadSchema = z.object({
  url: z.string(),
  inputEvents: z.array(capturedInputSchema)
})

const webInputElementSchema = z.object({
  domCoordinates: z.object({ x: z.number(), y: z.number() }),
  domOrdinal: z.number(),
  domPath: z.string(),
  kind: z.nativeEnum(WebInputType),
  url: z.string()
})

const settingsSchema = z.object({
  autofill: z.boolean(),
  language: z.string(),
  syncTOTP: z.boolean(),
  theme: z.string().optional().nullable(),
  vaultLockTimeoutSeconds: z.number()
})

const backgroundStateSerializableLockedSchema = z.object({
  email: z.string(),
  userId: z.string(),
  secrets: z.array(
    z.object({
      id: z.string(),
      encrypted: z.string(),
      kind: z.nativeEnum(EncryptedSecretType),
      lastUsedAt: z.string().nullable().optional(),
      createdAt: z.string(),
      deletedAt: z.string().nullable().optional(),
      updatedAt: z.string().nullable().optional()
    })
  ),
  encryptionSalt: z.string(),
  deviceName: z.string(),
  authSecretEncrypted: z.string(),
  authSecret: z.string(),
  lockTime: z.number(),
  autofill: z.boolean(),
  language: z.string(),
  theme: z.string(),
  syncTOTP: z.boolean(),
  masterEncryptionKey: z.string()
})

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true
})

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

const appRouter = t.router({
  addLoginCredentials: t.procedure
    .input(loginCredentialsFromContentScriptSchema)
    .mutation(async ({ ctx, input }) => {
      //@ts-ignore
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
        url: inputsUrl,
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
        browser.tabs.create({ url: `vault.html#/secret/${secret.id}` })
      }
    }),
  saveCapturedInputEvents: t.procedure
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
  saveLoginCredentialsModalShown: t.procedure
    .input(loginCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      //@ts-ignore
      const tab = ctx.sender.tab
      const currentTabId = tab.id

      if (currentTabId) {
        saveLoginModalsStates.set(currentTabId, input)
      }
    }),
  hideLoginCredentialsModal: t.procedure.mutation(async ({ ctx }) => {
    //@ts-ignore
    const tab = ctx.sender.tab
    const currentTabId = tab.id
    if (currentTabId) {
      saveLoginModalsStates.delete(currentTabId)
    }
  }),
  addTOTPInput: t.procedure
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
  getFallbackUsernames: t.procedure.query(async () => {
    const deviceState = device.state
    log('Getting fallback usernames', deviceState?.email)
    return [deviceState?.email]
  }),
  getContentScriptInitialState: t.procedure.query(async ({ ctx }) => {
    //@ts-ignore
    const tab = ctx.sender.tab
    const currentTabId = tab.id
    const tabUrl = tab?.url
    const deviceState = device.state

    log('GEtting initial state from BG', tab?.url, tab?.pendingUrl)
    if (!tabUrl || !deviceState || !currentTabId) {
      log('~ chromeRuntimeListener We dont have tabURL or deviceState or tabId')
      return null
    } else {
      //We will have to get webInputs for current URL from DB and send it to content script for reseting after new DOM path save
      return getContentScriptInitialState(tabUrl, currentTabId)
    }
  }),
  getCapturedInputEvents: t.procedure.query(async ({ ctx }) => {
    //@ts-ignore
    const tab = ctx.sender.tab
    return { capturedInputEvents, inputsUrl: tab?.url }
  }),
  securitySettings: t.procedure
    .input(settingsSchema)
    .mutation(async ({ input }) => {
      const deviceState = device.state
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
      }

      return true
    }),
  setLockInterval: t.procedure
    .input(z.object({ time: z.number() }))
    .mutation(async ({ input }) => {
      if (!lockInterval) {
        lockTimeStart = Date.now()
        lockTimeEnd = lockTimeStart + input.time * 1000
      }
      checkInterval(lockTimeEnd)
      return true
    }),
  clearLockInterval: t.procedure.mutation(async () => {
    resetInterval()
    return true
  }),
  setDeviceState: t.procedure
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
