import {
  isPasskeyBridgeResponse,
  isPasskeyPacket,
  isPasskeyRequestMessage,
  isRecord,
  passkeyChannel,
  passkeyExtensionSource,
  passkeyPageSource,
  type PasskeyBridgeResponse,
  type PasskeyRequestMessage
} from './bridgeProtocol'
import type { PasskeyCredentialResult } from './webauthn'

export function encodePasskeyBuffer(value: BufferSource): string {
  const bytes = ArrayBuffer.isView(value)
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodePasskeyBuffer(value: string): ArrayBuffer {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}

/** Clone binary views using their byte range, including DataView and Node buffers. */
export function serializePasskeyRequest(
  operation: 'create' | 'get',
  options:
    | PublicKeyCredentialCreationOptions
    | PublicKeyCredentialRequestOptions,
  requestId: string
): PasskeyRequestMessage | undefined {
  // Malformed input belongs to the native API, which supplies its usual errors.
  try {
    const serialized = JSON.stringify(
      options,
      function (this: Record<string, unknown>, key, value: unknown) {
        // Buffer.toJSON runs before the replacer; inspect the original property.
        const original = this[key]
        if (original instanceof ArrayBuffer || ArrayBuffer.isView(original)) {
          return encodePasskeyBuffer(original as BufferSource)
        }
        return value
      }
    )
    if (serialized.length > 1048576) return undefined
    const message: unknown = {
      kind: 'authierPasskeyRequest',
      requestId,
      operation,
      options: JSON.parse(serialized)
    }
    if (isPasskeyRequestMessage(message)) return message
    return undefined
  } catch {
    return undefined
  }
}

/** Native WebAuthn constructors are not public, so shadow their branded getters. */
export function restorePasskeyCredential(
  result: PasskeyCredentialResult,
  operation: 'create' | 'get'
): PublicKeyCredential {
  const data = result.response
  const responsePrototype =
    operation === 'create'
      ? AuthenticatorAttestationResponse.prototype
      : AuthenticatorAssertionResponse.prototype
  const response = Object.create(responsePrototype) as AuthenticatorResponse
  const responseProperties: PropertyDescriptorMap = {
    clientDataJSON: {
      value: decodePasskeyBuffer(data.clientDataJSON),
      enumerable: true
    }
  }
  if (operation === 'create') {
    if (
      !data.attestationObject ||
      !data.publicKey ||
      data.publicKeyAlgorithm === undefined
    ) {
      throw new DOMException(
        'Incomplete passkey registration response.',
        'UnknownError'
      )
    }
    responseProperties.attestationObject = {
      value: decodePasskeyBuffer(data.attestationObject),
      enumerable: true
    }
    responseProperties.getTransports = {
      value: () => [...(data.transports ?? [])]
    }
    responseProperties.getAuthenticatorData = {
      value: () => decodePasskeyBuffer(data.authenticatorData)
    }
    const publicKey = data.publicKey
    responseProperties.getPublicKey = {
      value: () => decodePasskeyBuffer(publicKey)
    }
    responseProperties.getPublicKeyAlgorithm = {
      value: () => data.publicKeyAlgorithm
    }
  } else {
    if (!data.signature) {
      throw new DOMException(
        'Incomplete passkey authentication response.',
        'UnknownError'
      )
    }
    responseProperties.authenticatorData = {
      value: decodePasskeyBuffer(data.authenticatorData),
      enumerable: true
    }
    responseProperties.signature = {
      value: decodePasskeyBuffer(data.signature),
      enumerable: true
    }
    responseProperties.userHandle = {
      value:
        data.userHandle === undefined
          ? null
          : decodePasskeyBuffer(data.userHandle),
      enumerable: true
    }
  }
  Object.defineProperties(response, responseProperties)
  const credential = Object.create(
    PublicKeyCredential.prototype
  ) as PublicKeyCredential
  Object.defineProperties(credential, {
    id: { value: result.id, enumerable: true },
    rawId: { value: decodePasskeyBuffer(result.rawId), enumerable: true },
    type: { value: 'public-key', enumerable: true },
    authenticatorAttachment: {
      value: result.authenticatorAttachment,
      enumerable: true
    },
    response: { value: response, enumerable: true },
    getClientExtensionResults: {
      value: () => structuredClone(result.clientExtensionResults)
    },
    toJSON: { value: () => structuredClone(result) }
  })
  return credential
}

const providerUnavailableAfterMs = 500
const defaultRequestTimeoutMs = 120000

export function installPasskeyPage() {
  const credentials = navigator.credentials
  if (
    !window.isSecureContext ||
    window.top !== window ||
    !credentials?.create ||
    !credentials.get
  ) {
    return () => {}
  }
  const nativeCreate = credentials.create
  const nativeGet = credentials.get
  const createDescriptor = Object.getOwnPropertyDescriptor(
    credentials,
    'create'
  )
  const getDescriptor = Object.getOwnPropertyDescriptor(credentials, 'get')
  const publicKeyConstructor = globalThis.PublicKeyCredential
  const capabilityDescriptor =
    publicKeyConstructor &&
    Object.getOwnPropertyDescriptor(
      publicKeyConstructor,
      'isUserVerifyingPlatformAuthenticatorAvailable'
    )
  const nativePlatformAvailable =
    publicKeyConstructor?.isUserVerifyingPlatformAuthenticatorAvailable
  const origin = window.location.origin
  const pending = new Map<string, (type: string, response: unknown) => void>()
  const onMessage = (event: MessageEvent<unknown>) => {
    if (
      event.source !== window ||
      event.origin !== origin ||
      !isPasskeyPacket(event.data, passkeyExtensionSource) ||
      !isRecord(event.data) ||
      typeof event.data.requestId !== 'string' ||
      typeof event.data.type !== 'string'
    )
      return
    pending.get(event.data.requestId)?.(event.data.type, event.data.response)
  }
  window.addEventListener('message', onMessage)

  if (nativePlatformAvailable) {
    Object.defineProperty(
      publicKeyConstructor,
      'isUserVerifyingPlatformAuthenticatorAvailable',
      {
        configurable: true,
        writable: true,
        value: () =>
          new Promise<boolean>((resolve, reject) => {
            const requestId = crypto.randomUUID()
            const timer = window.setTimeout(() => {
              pending.delete(requestId)
              void nativePlatformAvailable
                .call(publicKeyConstructor)
                .then(resolve, reject)
            }, providerUnavailableAfterMs)
            pending.set(requestId, (type) => {
              if (type !== 'available') return
              pending.delete(requestId)
              window.clearTimeout(timer)
              resolve(true)
            })
            window.postMessage(
              {
                channel: passkeyChannel,
                source: passkeyPageSource,
                type: 'probe',
                requestId
              },
              origin
            )
          })
      }
    )
  }

  const request = async (
    message: PasskeyRequestMessage,
    signal: AbortSignal | undefined
  ): Promise<PasskeyBridgeResponse> => {
    if (signal?.aborted)
      throw (
        signal.reason ??
        new DOMException('The operation was aborted.', 'AbortError')
      )
    return new Promise((resolve, reject) => {
      const timeoutMs = Math.min(
        300000,
        Math.max(1000, message.options.timeout ?? defaultRequestTimeoutMs)
      )
      const postCancel = () =>
        window.postMessage(
          {
            channel: passkeyChannel,
            source: passkeyPageSource,
            type: 'cancel',
            message: {
              kind: 'authierPasskeyCancel',
              requestId: message.requestId
            }
          },
          origin
        )
      const clear = () => {
        pending.delete(message.requestId)
        window.clearTimeout(providerTimer)
        window.clearTimeout(timeoutTimer)
        signal?.removeEventListener('abort', abort)
      }
      const abort = () => {
        clear()
        postCancel()
        reject(
          signal?.reason ??
            new DOMException('The operation was aborted.', 'AbortError')
        )
      }
      const providerTimer = window.setTimeout(() => {
        clear()
        postCancel()
        resolve({ status: 'fallback' })
      }, providerUnavailableAfterMs)
      const timeoutTimer = window.setTimeout(() => {
        clear()
        postCancel()
        reject(
          new DOMException('The passkey request timed out.', 'NotAllowedError')
        )
      }, timeoutMs)
      pending.set(message.requestId, (type, response) => {
        if (type === 'received') {
          window.clearTimeout(providerTimer)
          return
        }
        if (type !== 'response' || !isPasskeyBridgeResponse(response)) return
        clear()
        resolve(response)
      })
      signal?.addEventListener('abort', abort, { once: true })
      window.postMessage(
        {
          channel: passkeyChannel,
          source: passkeyPageSource,
          type: 'request',
          message
        },
        origin
      )
    })
  }

  const intercept = async (
    operation: 'create' | 'get',
    options: CredentialCreationOptions | CredentialRequestOptions | undefined,
    native: () => Promise<Credential | null>
  ) => {
    // Conditional/autofill mediation and embedded frames remain with the browser.
    const mediation =
      options && 'mediation' in options ? options.mediation : undefined
    if (
      !options?.publicKey ||
      mediation === 'conditional' ||
      mediation === 'silent'
    ) {
      return native()
    }
    const message = serializePasskeyRequest(
      operation,
      options.publicKey,
      crypto.randomUUID()
    )
    if (!message) return native()
    const response = await request(message, options.signal)
    if (response.status === 'fallback') return native()
    if (response.status === 'error')
      throw new DOMException(response.message, response.name)
    return restorePasskeyCredential(response.credential, operation)
  }
  Object.defineProperties(credentials, {
    create: {
      configurable: true,
      writable: true,
      value: function create(
        this: CredentialsContainer,
        options?: CredentialCreationOptions
      ) {
        if (this !== credentials) return nativeCreate.call(this, options)
        return intercept('create', options, () =>
          nativeCreate.call(credentials, options)
        )
      }
    },
    get: {
      configurable: true,
      writable: true,
      value: function get(
        this: CredentialsContainer,
        options?: CredentialRequestOptions
      ) {
        if (this !== credentials) return nativeGet.call(this, options)
        return intercept('get', options, () =>
          nativeGet.call(credentials, options)
        )
      }
    }
  })
  return () => {
    window.removeEventListener('message', onMessage)
    if (createDescriptor)
      Object.defineProperty(credentials, 'create', createDescriptor)
    else Reflect.deleteProperty(credentials, 'create')
    if (getDescriptor) Object.defineProperty(credentials, 'get', getDescriptor)
    else Reflect.deleteProperty(credentials, 'get')
    if (capabilityDescriptor)
      Object.defineProperty(
        publicKeyConstructor,
        'isUserVerifyingPlatformAuthenticatorAvailable',
        capabilityDescriptor
      )
  }
}
