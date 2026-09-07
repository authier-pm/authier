import browser from 'webextension-polyfill'
import { z } from 'zod'
import { device, deviceInitialization } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import {
  cryptoKeyToString,
  decryptDeviceSecretWithPassword
} from '@shared/cryptoUtils'
import {
  isPasskeyCancelMessage,
  isPasskeyRequestMessage
} from './bridgeProtocol'
import {
  PasskeyRequestManager,
  passkeyErrorReply
} from './passkeyRequestManager'
import type { PasskeyApprovalReply } from './passkeyApprovalTypes'

const approvalUrl = (token: string) =>
  browser.runtime.getURL(`js/passkey.html?request=${encodeURIComponent(token)}`)
const currentSnapshot = () => device.state ?? device.lockedState

export const passkeyRequestManager = new PasskeyRequestManager(
  {
    initialize: () => deviceInitialization,
    identity: () => {
      const snapshot = currentSnapshot()
      return snapshot ? `${snapshot.userId}:${snapshot.encryptionSalt}` : null
    },
    session: () => {
      const state = device.state
      if (state?.lockTimeEnd && state.lockTimeEnd <= Date.now()) return null
      return state
    },
    verifyPassword: async (password) => {
      const snapshot = currentSnapshot()
      if (!snapshot)
        throw new DOMException('Sign in to Authier first.', 'NotAllowedError')
      const result = await decryptDeviceSecretWithPassword(password, snapshot)
      if (!result.masterEncryptionKey || !result.addDeviceSecret) {
        throw new DOMException('Incorrect master password.', 'NotAllowedError')
      }
      if (snapshot !== currentSnapshot())
        throw new DOMException(
          'The vault changed. Please try again.',
          'NotAllowedError'
        )
      let verifiedSession = device.state
      if (!device.state) {
        const masterEncryptionKey = await cryptoKeyToString(
          result.masterEncryptionKey
        )
        if (snapshot !== currentSnapshot())
          throw new DOMException(
            'The vault changed. Please try again.',
            'NotAllowedError'
          )
        const saving = device.save({
          ...snapshot,
          authSecret: result.addDeviceSecret,
          masterEncryptionKey
        })
        // save installs the state synchronously; bind verification to this exact
        // session, even if locking or another unlock happens during persistence.
        verifiedSession = device.state
        await saving
      }
      if (!verifiedSession || verifiedSession !== device.state)
        throw new DOMException(
          'The vault changed. Please try again.',
          'NotAllowedError'
        )
      device.setLockTime(snapshot.vaultLockTimeoutSeconds ?? 0)
      return verifiedSession
    },
    list: async () => {
      if (!device.state)
        throw new DOMException('Unlock Authier first.', 'NotAllowedError')
      const secrets = await device.state.getAllSecretsDecrypted()
      return secrets
        .filter((secret) => secret.kind === EncryptedSecretType.PASSKEY)
        .map((secret) => secret.passkey)
    },
    save: async (passkey) => {
      const state = device.state
      if (!state)
        throw new DOMException('Unlock Authier first.', 'NotAllowedError')
      await state.addSecrets([
        {
          kind: EncryptedSecretType.PASSKEY,
          passkey,
          encrypted: '',
          createdAt: passkey.createdAt
        }
      ])
    }
  },
  {
    extensionId: browser.runtime.id,
    approvalUrl,
    open: async (token) => {
      const window = await browser.windows.create({
        url: approvalUrl(token),
        type: 'popup',
        width: 440,
        height: 650,
        focused: true
      })
      if (window.id === undefined)
        throw new Error('Failed to open passkey approval')
      return window.id
    },
    // The user may already have closed the window. That benign race needs no error UI.
    close: (windowId) =>
      browser.windows.remove(windowId).catch(() => undefined),
    isCurrentTab: (tabId, url) =>
      browser.tabs.get(tabId).then(
        (tab) => tab.url === url && tab.active,
        () => false
      )
  }
)

const approvalMessageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('authierPasskeyView'), token: z.string().uuid() }),
  z.object({
    kind: z.literal('authierPasskeyVerify'),
    token: z.string().uuid(),
    password: z.string().min(1).max(4096)
  }),
  z.object({
    kind: z.literal('authierPasskeyApprove'),
    token: z.string().uuid(),
    credentialId: z.string().max(2048).optional()
  }),
  z.object({
    kind: z.literal('authierPasskeyDismiss'),
    token: z.string().uuid(),
    fallback: z.boolean()
  })
])

/** Handle before the legacy runtime relay so passkey traffic never reaches unrelated tabs. */
export function handlePasskeyMessage(
  message: unknown,
  sender: browser.Runtime.MessageSender
) {
  if (isPasskeyRequestMessage(message)) {
    return passkeyRequestManager.begin(message, sender).catch(passkeyErrorReply)
  }
  if (isPasskeyCancelMessage(message)) {
    passkeyRequestManager.cancel(message.requestId, sender)
    return Promise.resolve(true)
  }
  const parsed = approvalMessageSchema.safeParse(message)
  if (parsed.success) {
    const action = parsed.data
    const respond = async (): Promise<PasskeyApprovalReply> => {
      if (action.kind === 'authierPasskeyView')
        return {
          status: 'ready',
          view: await passkeyRequestManager.view(action.token, sender)
        }
      if (action.kind === 'authierPasskeyVerify')
        return {
          status: 'ready',
          view: await passkeyRequestManager.verify(
            action.token,
            action.password,
            sender
          )
        }
      if (action.kind === 'authierPasskeyApprove')
        await passkeyRequestManager.approve(
          action.token,
          action.credentialId,
          sender
        )
      if (action.kind === 'authierPasskeyDismiss')
        passkeyRequestManager.dismiss(action.token, action.fallback, sender)
      return { status: 'done' }
    }
    return respond().catch((error: unknown): PasskeyApprovalReply => ({
      status: 'error',
      message:
        error instanceof DOMException
          ? error.message
          : 'Authier could not save or use this passkey. Please try again.'
    }))
  }
  // Swallow malformed messages in this namespace instead of forwarding them.
  if (
    typeof message === 'object' &&
    message !== null &&
    'kind' in message &&
    typeof message.kind === 'string' &&
    message.kind.startsWith('authierPasskey')
  ) {
    return Promise.resolve(
      passkeyErrorReply(
        new DOMException('Invalid passkey request.', 'DataError')
      )
    )
  }
}

browser.tabs.onRemoved.addListener((tabId) =>
  passkeyRequestManager.cancelTab(tabId)
)
browser.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading' || change.url)
    passkeyRequestManager.cancelTab(tabId)
})
browser.windows.onRemoved.addListener((windowId) =>
  passkeyRequestManager.windowClosed(windowId)
)
