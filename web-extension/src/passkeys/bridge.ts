import {
  isPasskeyBridgeResponse,
  isPasskeyCancelMessage,
  isPasskeyPacket,
  isPasskeyRequestMessage,
  isRecord,
  passkeyChannel,
  passkeyExtensionSource,
  passkeyPageSource,
  type PasskeyBridgeResponse,
  type PasskeyCancelMessage,
  type PasskeyRequestMessage
} from './bridgeProtocol'

export type PasskeyRuntimeSend = (
  message: PasskeyRequestMessage | PasskeyCancelMessage
) => Promise<unknown>

/** This isolated-world bridge never trusts origins supplied by the page. */
export function installPasskeyBridge(sendMessage: PasskeyRuntimeSend) {
  if (!window.isSecureContext || window.top !== window) return () => {}
  const pending = new Set<string>()
  const origin = window.location.origin
  const post = (
    type: 'received' | 'response',
    requestId: string,
    response?: PasskeyBridgeResponse
  ) => {
    window.postMessage(
      {
        channel: passkeyChannel,
        source: passkeyExtensionSource,
        type,
        requestId,
        response
      },
      origin
    )
  }
  const onMessage = (event: MessageEvent<unknown>) => {
    if (
      event.source !== window ||
      event.origin !== origin ||
      !isPasskeyPacket(event.data, passkeyPageSource) ||
      !isRecord(event.data)
    ) {
      return
    }
    const { type, message } = event.data
    if (
      type === 'probe' &&
      typeof event.data.requestId === 'string' &&
      event.data.requestId.length <= 128
    ) {
      window.postMessage(
        {
          channel: passkeyChannel,
          source: passkeyExtensionSource,
          type: 'available',
          requestId: event.data.requestId
        },
        origin
      )
      return
    }
    if (type === 'cancel' && isPasskeyCancelMessage(message)) {
      if (pending.delete(message.requestId)) {
        // The extension may have been reloaded while a request was pending.
        void sendMessage(message).catch(() => undefined)
      }
      return
    }
    if (type !== 'request' || !isPasskeyRequestMessage(message)) return
    if (pending.has(message.requestId)) return
    if (pending.size >= 8) {
      post('response', message.requestId, {
        status: 'error',
        name: 'NotAllowedError',
        message: 'Too many pending passkey requests.'
      })
      return
    }
    pending.add(message.requestId)
    post('received', message.requestId)
    const respond = (response: unknown) => {
      if (!pending.delete(message.requestId)) return
      post(
        'response',
        message.requestId,
        isPasskeyBridgeResponse(response) ? response : { status: 'fallback' }
      )
    }
    // A disconnected or unavailable extension must preserve the native provider.
    void sendMessage(message).then(respond, () =>
      respond({ status: 'fallback' })
    )
  }
  const cancelPending = () => {
    for (const requestId of pending) {
      void sendMessage({ kind: 'authierPasskeyCancel', requestId }).catch(
        () => undefined
      )
    }
    pending.clear()
  }
  window.addEventListener('message', onMessage)
  window.addEventListener('pagehide', cancelPending)
  return () => {
    cancelPending()
    window.removeEventListener('message', onMessage)
    window.removeEventListener('pagehide', cancelPending)
  }
}
