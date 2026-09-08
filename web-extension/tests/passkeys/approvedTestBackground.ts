/** Test-only provider: approval is supplied by the test, never shipped in Authier. */
import browser from 'webextension-polyfill'
import type { PasskeyData } from '@shared/passkeySchema'
import { isPasskeyRequestMessage } from '../../src/passkeys/bridgeProtocol'
import { createPasskey, getPasskeyAssertion } from '../../src/passkeys/webauthn'

declare global {
  var authierPasskeyTestState: PasskeyData | undefined
}

browser.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isPasskeyRequestMessage(message) || sender.frameId !== 0 || !sender.url)
    return undefined
  const origin = new URL(sender.url).origin
  if (message.operation === 'create') {
    return createPasskey(message.options, origin, true).then(
      ({ passkey, credential }) => {
        globalThis.authierPasskeyTestState = passkey
        return { status: 'ok', credential }
      }
    )
  }
  const passkey = globalThis.authierPasskeyTestState
  if (!passkey) return Promise.resolve({ status: 'fallback' })
  return getPasskeyAssertion(passkey, message.options, origin, true).then(
    (credential) => ({ status: 'ok', credential })
  )
})
