import type {
  PasskeyCreationOptions,
  PasskeyCredentialResult,
  PasskeyRequestOptions
} from './webauthn'

export const passkeyChannel = 'authier-webauthn-v1'
export const passkeyPageSource = 'authier-page'
export const passkeyExtensionSource = 'authier-extension'

export type PasskeyRequestMessage = {
  kind: 'authierPasskeyRequest'
  requestId: string
} & (
  | { operation: 'create'; options: PasskeyCreationOptions }
  | { operation: 'get'; options: PasskeyRequestOptions }
)

export interface PasskeyCancelMessage {
  kind: 'authierPasskeyCancel'
  requestId: string
}

export type PasskeyBridgeResponse =
  | { status: 'ok'; credential: PasskeyCredentialResult }
  | { status: 'fallback' }
  | { status: 'error'; name: string; message: string }

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isShortString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 4096
}

function isEncodedBuffer(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 131072 &&
    /^[A-Za-z0-9_-]*$/.test(value)
  )
}

function isRequestId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
}

function isDescriptorList(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length <= 256 &&
      value.every(
        (descriptor: unknown) =>
          isRecord(descriptor) &&
          descriptor.type === 'public-key' &&
          isEncodedBuffer(descriptor.id) &&
          (descriptor.transports === undefined ||
            (Array.isArray(descriptor.transports) &&
              descriptor.transports.length <= 16 &&
              descriptor.transports.every(isShortString)))
      ))
  )
}

export function isPasskeyRequestMessage(
  value: unknown
): value is PasskeyRequestMessage {
  if (
    !isRecord(value) ||
    value.kind !== 'authierPasskeyRequest' ||
    !isRequestId(value.requestId) ||
    !isRecord(value.options) ||
    !isEncodedBuffer(value.options.challenge)
  ) {
    return false
  }
  const options = value.options
  if (
    (options.timeout !== undefined &&
      (typeof options.timeout !== 'number' ||
        !Number.isFinite(options.timeout) ||
        options.timeout < 0)) ||
    (options.extensions !== undefined && !isRecord(options.extensions))
  ) {
    return false
  }
  if (value.operation === 'get') {
    return (
      (options.rpId === undefined || isShortString(options.rpId)) &&
      isDescriptorList(options.allowCredentials)
    )
  }
  if (value.operation !== 'create') return false
  return (
    isRecord(options.rp) &&
    isShortString(options.rp.name) &&
    (options.rp.id === undefined || isShortString(options.rp.id)) &&
    isRecord(options.user) &&
    isEncodedBuffer(options.user.id) &&
    isShortString(options.user.name) &&
    isShortString(options.user.displayName) &&
    Array.isArray(options.pubKeyCredParams) &&
    options.pubKeyCredParams.length <= 64 &&
    options.pubKeyCredParams.every(
      (parameter: unknown) =>
        isRecord(parameter) &&
        parameter.type === 'public-key' &&
        typeof parameter.alg === 'number' &&
        Number.isInteger(parameter.alg)
    ) &&
    isDescriptorList(options.excludeCredentials) &&
    (options.authenticatorSelection === undefined ||
      isRecord(options.authenticatorSelection))
  )
}

export function isPasskeyCancelMessage(
  value: unknown
): value is PasskeyCancelMessage {
  return (
    isRecord(value) &&
    value.kind === 'authierPasskeyCancel' &&
    isRequestId(value.requestId)
  )
}

export function isPasskeyBridgeResponse(
  value: unknown
): value is PasskeyBridgeResponse {
  if (!isRecord(value)) return false
  if (value.status === 'fallback') return true
  if (value.status === 'error') {
    return isShortString(value.name) && isShortString(value.message)
  }
  if (value.status !== 'ok' || !isRecord(value.credential)) return false
  const credential = value.credential
  if (
    credential.type !== 'public-key' ||
    !isEncodedBuffer(credential.id) ||
    !isEncodedBuffer(credential.rawId) ||
    credential.authenticatorAttachment !== 'platform' ||
    !isRecord(credential.clientExtensionResults) ||
    !isRecord(credential.response)
  ) {
    return false
  }
  const response = credential.response
  return (
    isEncodedBuffer(response.clientDataJSON) &&
    isEncodedBuffer(response.authenticatorData) &&
    ['attestationObject', 'signature', 'userHandle', 'publicKey'].every(
      (key) => response[key] === undefined || isEncodedBuffer(response[key])
    ) &&
    (response.publicKeyAlgorithm === undefined ||
      typeof response.publicKeyAlgorithm === 'number') &&
    (response.transports === undefined ||
      (Array.isArray(response.transports) &&
        response.transports.length <= 16 &&
        response.transports.every(isShortString)))
  )
}

export function isPasskeyPacket(value: unknown, source: string) {
  return (
    isRecord(value) &&
    value.channel === passkeyChannel &&
    value.source === source
  )
}
