import { handlePasskeyMessage } from '../passkeys/backgroundPasskeys'
import { initializePendingSecretSync } from './pendingSecretSync'
import { handleTotpAccountEmailMessage } from './totpAccountEmail'
import {
  handleVerificationCodeMessage,
  initializeVerificationCodes
} from './verificationCodes'
import { fetchRelayedVerificationCodes } from './relayedVerificationCodes'
import {
  appendGeneratedPasswordHistoryEntry,
  generatedPasswordHistoryEntrySchema
} from '@src/util/generatedPasswordHistory'
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
  loginDraftSchema,
  settingsSchema,
  webInputElementSchema
} from './backgroundSchemas'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { getAutofillSender, isExtensionPageSender } from './autofillSender'
import {
  capturedInputsByDocument,
  saveLoginModalsStates
} from './autofillPageState'
import { synchronizeAutofillSession } from './autofillInvalidation'
import { openVaultTab } from '@src/AuthLinkPage'
import { tc } from './tc'
import { loggerMiddleware } from './loggerMiddleware'
import { mainWorldAutofillFunction } from '../content-script/getAllInputsIncludingShadowDom'
import { constructURL } from '@shared/urlUtils'
import { loginSessionManager } from './loginSession'
import { createLoginCredentialData } from './createLoginCredentialData'
import { classifyPasswordForm } from './classifyPasswordForm'
import {
  normalizePasswordFormUrl,
  passwordFormSnapshotSchema
} from '@shared/passwordFormClassification'
import {
  refreshAutofillForDomain,
  isAutofillPagePauseGetMessage,
  isAutofillPagePauseSetMessage,
  isAutofillPausedForPage,
  setAutofillPausedForPage
} from './autofillPagePause'

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
export const noHandsLogin = false

const tcProcedure = tc.procedure.use(loggerMiddleware)
const extensionProcedure = tcProcedure.use(({ ctx, next }) => {
  if (!isExtensionPageSender(ctx.sender))
    throw new TRPCError({ code: 'FORBIDDEN' })
  return next()
})
const contentProcedure = tcProcedure.use(async ({ ctx, next }) => {
  const autofillSender = getAutofillSender(ctx.sender)
  if (!autofillSender || !(await device.ensureUnlocked()))
    throw new TRPCError({ code: 'FORBIDDEN' })
  return next({ ctx: { ...ctx, autofillSender } })
})

void initializePendingSecretSync().catch(() => {
  console.warn(
    'Automatic synchronization could not be scheduled; use Synchronize vault to retry'
  )
})

void initializeVerificationCodes({
  fetchRelayedCodes: fetchRelayedVerificationCodes,
  pollRelayedInBackground: true
}).catch((error: unknown) => {
  console.error('Failed to initialize verification code polling', error)
})

void loginSessionManager.initialize().catch((error: unknown) => {
  console.error('Failed to initialize the background login session', error)
})

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'session' && changes.backgroundState) {
    void synchronizeAutofillSession(changes.backgroundState)
  }
  if (areaName === 'session' && changes.backgroundState?.newValue) {
    void loginSessionManager.resetLogin().catch((error: unknown) => {
      console.error('Failed to clear the completed login session', error)
    })
  }
})

browser.runtime.onMessage.addListener((message: unknown, sender) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('kind' in message) ||
    message.kind !== 'appendGeneratedPasswordHistory' ||
    !('entry' in message)
  )
    return
  const parsed = generatedPasswordHistoryEntrySchema.safeParse(message.entry)
  if (!parsed.success || !sender.url || sender.url !== parsed.data.pageUrl)
    return
  return appendGeneratedPasswordHistoryEntry(parsed.data).then(() => true)
})

const appRouter = tc.router({
  getLoginSession: extensionProcedure.query(() =>
    loginSessionManager.getSnapshot()
  ),
  updateLoginDraft: extensionProcedure
    .input(loginDraftSchema)
    .mutation(({ input }) => loginSessionManager.updateDraft(input)),
  startLogin: extensionProcedure
    .input(loginDraftSchema)
    .mutation(({ input }) => loginSessionManager.startLogin(input)),
  resetLogin: extensionProcedure.mutation(() =>
    loginSessionManager.resetLogin()
  ),
  initiateLoginMasterDeviceReset: extensionProcedure.mutation(() =>
    loginSessionManager.initiateMasterDeviceReset()
  ),
  addLoginCredentials: contentProcedure
    .input(loginCredentialsFromContentScriptSchema)
    .mutation(async ({ ctx, input }) => {
      const tab = ctx.sender?.tab

      if (!tab) {
        return false
      }

      const deviceState = device.state

      const { url } = ctx.autofillSender

      if (!url || !deviceState) {
        return false // we can't do anything without a valid url
      }
      let urlParsed: URL

      try {
        urlParsed = new URL(url)
      } catch {
        return false
      }

      const credentials = input

      const encryptedData = createLoginCredentialData({
        fallbackUsername: deviceState.email,
        favIconUrl: tab.favIconUrl,
        hostname: urlParsed.hostname,
        password: credentials.password,
        username: credentials.username
      })

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

      saveLoginModalsStates.delete(ctx.autofillSender.key)
      const webInputs = credentials.capturedInputEvents.map((captured) => {
        return {
          domPath: captured.cssSelector,
          kind: captured.kind,
          url,
          domOrdinal: captured.domOrdinal
        }
      })

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
  saveCapturedInputEvents: contentProcedure
    .input(capturedEventsPayloadSchema)
    .mutation(async ({ input, ctx }) => {
      const sender = getAutofillSender(ctx.sender, input.url)
      if (!sender) return
      if (navigator.onLine === false) {
        console.log('ignoring saving of inputs because we are offline')
        return
      }

      capturedInputsByDocument.set(ctx.autofillSender.key, input.inputEvents)

      const newWebInputs = input.inputEvents.map((captured) => {
        return {
          domPath: captured.cssSelector,
          kind: captured.kind,
          url: sender.url,
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
  saveLoginCredentialsModalShown: contentProcedure
    .input(loginCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      saveLoginModalsStates.set(ctx.autofillSender.key, input)
    }),
  hideLoginCredentialsModal: contentProcedure.mutation(async ({ ctx }) => {
    saveLoginModalsStates.delete(ctx.autofillSender.key)
  }),
  addTOTPInput: contentProcedure
    .input(webInputElementSchema)
    .mutation(async ({ input, ctx }) => {
      if (!getAutofillSender(ctx.sender, input.url)) return
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
  classifyPasswordForm: tcProcedure
    .input(passwordFormSnapshotSchema)
    .mutation(async ({ ctx, input }) => {
      const sender = getAutofillSender(ctx.sender, input.url)
      if (!sender || normalizePasswordFormUrl(sender.url) !== input.url)
        return null
      const state = await getContentScriptInitialState(
        sender.url,
        sender.tabId,
        sender.key
      )
      if (!state.extensionDeviceReady || !state.autofillEnabled) return null
      return classifyPasswordForm(input)
    }),
  executeMainWorldAutofillFunction: tcProcedure
    .input(
      z.object({
        url: z.string().url(),
        credentials: z.array(
          loginCredentialSchema.extend({ lastUsedAt: z.string().nullable() })
        )
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sender = getAutofillSender(ctx.sender, input.url)
      if (!sender) return []
      const session = device.state
      const initialState = await getContentScriptInitialState(
        sender.url,
        sender.tabId,
        sender.key
      )
      if (!initialState.autofillEnabled || !session || device.state !== session)
        return []
      // Do not let a stale content script inject cached credentials after locking,
      // switching accounts, or navigating to a different credential origin.
      const credentials = initialState.secretsForHost.loginCredentials
        .filter(({ loginCredentials }) =>
          input.credentials.some(
            (requested) =>
              requested.username === loginCredentials.username &&
              requested.password === loginCredentials.password
          )
        )
        .map(({ loginCredentials, lastUsedAt }) => ({
          username: loginCredentials.username,
          password: loginCredentials.password,
          lastUsedAt: lastUsedAt ?? null
        }))
      if (credentials.length === 0) return []

      const results = await browser.scripting
        .executeScript({
          target: sender.documentId
            ? { tabId: sender.tabId, documentIds: [sender.documentId] }
            : { tabId: sender.tabId, frameIds: [sender.frameId] },
          world: 'MAIN',
          func: mainWorldAutofillFunction,
          args: [credentials, sender.url]
        })
        .catch(() => []) // The frame can disappear between validation and injection.

      return results[0]?.result || []
    }),
  getFallbackUsernames: tcProcedure.query(async ({ ctx }) => {
    if (!getAutofillSender(ctx.sender) || !(await device.ensureUnlocked()))
      return []
    return [device.state?.email]
  }),
  getContentScriptInitialState: tcProcedure
    .input(z.string().url().optional())
    .query(async ({ ctx, input }) => {
      const sender = getAutofillSender(ctx.sender, input)
      if (!sender) return null
      return getContentScriptInitialState(sender.url, sender.tabId, sender.key)
    }),
  getCapturedInputEvents: tcProcedure.query(async ({ ctx }) => {
    const sender = getAutofillSender(ctx.sender)
    if (!sender || !(await device.ensureUnlocked()))
      return { capturedInputEvents: [], inputsUrl: undefined }
    return {
      capturedInputEvents: capturedInputsByDocument.get(sender.key) ?? [],
      inputsUrl: sender.url
    }
  }),
  securitySettings: extensionProcedure
    .input(settingsSchema)
    .mutation(async ({ input }) => {
      const deviceState = device.state
      // console.log('securitySettings', input, device.state)
      if (deviceState) {
        await device.setDeviceSettings(input)
      }

      return true
    }),
  setLockInterval: extensionProcedure
    .input(z.object({ time: z.number().int().min(0).max(31_536_000) }))
    .mutation(async ({ input }) => {
      await device.setLockTime(input.time)
      return true
    }),
  setDeviceState: extensionProcedure
    .input(backgroundStateSerializableLockedSchema)
    .mutation(async ({ input }) => {
      await device.save(input)
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

browser.runtime.onMessage.addListener((request: unknown, sender) => {
  const totpEmailResponse = handleTotpAccountEmailMessage(request, sender)
  if (totpEmailResponse) return totpEmailResponse

  const codeResponse = handleVerificationCodeMessage(request, sender)
  if (codeResponse) return codeResponse

  const passkeyResponse = handlePasskeyMessage(request, sender)
  if (passkeyResponse) return passkeyResponse

  if (!isExtensionPageSender(sender)) return

  if (isAutofillPagePauseGetMessage(request)) {
    return isAutofillPausedForPage(request.tabId, request.url)
  }

  if (isAutofillPagePauseSetMessage(request)) {
    return setAutofillPausedForPage(request).then(async () => {
      await refreshAutofillForDomain(request.url)
      return request.paused
    })
  }

  return browser.tabs
    .query({ active: true, currentWindow: true })
    .then(async (tabs) => {
      const firstTabId = tabs[0]?.id

      if (firstTabId === undefined || !(await device.ensureUnlocked())) {
        return
      }
      return browser.tabs.sendMessage(firstTabId, request, { frameId: 0 })
    })
})
