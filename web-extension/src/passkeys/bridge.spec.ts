import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Buffer } from 'buffer'
import { installPasskeyBridge } from './bridge'
import {
  isPasskeyRequestMessage,
  isRecord,
  passkeyChannel,
  passkeyExtensionSource,
  passkeyPageSource,
  type PasskeyRequestMessage
} from './bridgeProtocol'
import {
  encodePasskeyBuffer,
  installPasskeyPage,
  serializePasskeyRequest
} from './page'

const origin = 'https://login.example.com'
const options: PublicKeyCredentialCreationOptions = {
  challenge: new Uint8Array([1, 2, 3]),
  rp: { name: 'Example', id: 'example.com' },
  user: { id: new Uint8Array([4, 5, 6]), name: 'alice', displayName: 'Alice' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
}
const getOptions: CredentialRequestOptions = {
  publicKey: { challenge: new Uint8Array([1, 2, 3]), rpId: 'example.com' }
}
const cleanups: Array<() => void> = []
const nativeCreate = vi.fn<CredentialsContainer['create']>()
const nativeGet = vi.fn<CredentialsContainer['get']>()

function receive(
  data: unknown,
  eventOrigin = origin,
  source: MessageEventSource | null = window
) {
  window.dispatchEvent(
    new MessageEvent('message', { data, origin: eventOrigin, source })
  )
}
function sendRequest(message: PasskeyRequestMessage) {
  receive({
    channel: passkeyChannel,
    source: passkeyPageSource,
    type: 'request',
    message
  })
}
function respond(requestId: string, response: unknown, type = 'response') {
  receive({
    channel: passkeyChannel,
    source: passkeyExtensionSource,
    type,
    requestId,
    response
  })
}
function latestRequest() {
  const packet: unknown = vi
    .mocked(window.postMessage)
    .mock.calls.find(([data]) => isRecord(data) && data.type === 'request')?.[0]
  if (!isRecord(packet) || !isPasskeyRequestMessage(packet.message))
    throw new Error('Missing passkey request')
  return packet.message
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true
  })
  Object.assign(window.location, { origin })
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: { create: nativeCreate, get: nativeGet }
  })
  nativeCreate.mockResolvedValue(null)
  nativeGet.mockResolvedValue(null)
  vi.spyOn(window, 'postMessage').mockImplementation(() => {})
})
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('passkey request serialization', () => {
  it('encodes only the exact bytes of typed-array and DataView slices', () => {
    const backing = new Uint8Array([99, 1, 2, 3, 99])
    expect(encodePasskeyBuffer(backing.subarray(1, 4))).toBe('AQID')
    expect(encodePasskeyBuffer(new DataView(backing.buffer, 1, 3))).toBe('AQID')
    const message = serializePasskeyRequest(
      'create',
      {
        ...options,
        challenge: backing.subarray(1, 4),
        user: { ...options.user, id: new DataView(backing.buffer, 1, 3) },
        excludeCredentials: [{ type: 'public-key', id: backing.subarray(1, 4) }]
      },
      'request-1'
    )
    expect(message?.options.challenge).toBe('AQID')
    expect(message?.operation === 'create' && message.options.user.id).toBe(
      'AQID'
    )
    expect(
      message?.operation === 'create' &&
        message.options.excludeCredentials?.[0].id
    ).toBe('AQID')
    const buffer = Buffer.from([99, 1, 2, 3, 99]).subarray(1, 4)
    expect(
      serializePasskeyRequest('get', { challenge: buffer }, 'buffer')?.options
        .challenge
    ).toBe('AQID')
  })
  it('rejects malformed and oversized page requests', () => {
    expect(
      isPasskeyRequestMessage({
        kind: 'authierPasskeyRequest',
        requestId: '1',
        operation: 'get',
        options: { challenge: [] }
      })
    ).toBe(false)
    expect(
      isPasskeyRequestMessage({
        kind: 'authierPasskeyRequest',
        requestId: 'a'.repeat(129),
        operation: 'get',
        options: { challenge: 'AQID' }
      })
    ).toBe(false)
    expect(
      serializePasskeyRequest('get', { challenge: new Uint8Array(131073) }, '1')
    ).toBeUndefined()
  })
})

describe('isolated passkey bridge', () => {
  it('accepts only same-window same-origin messages', async () => {
    const runtime = vi.fn().mockResolvedValue({ status: 'fallback' })
    cleanups.push(installPasskeyBridge(runtime))
    const message = serializePasskeyRequest('create', options, 'request-1')!
    const packet = {
      channel: passkeyChannel,
      source: passkeyPageSource,
      type: 'request',
      message
    }
    receive(packet, 'https://evil.example')
    receive(packet, origin, null)
    receive({ ...packet, source: passkeyExtensionSource })
    expect(runtime).not.toHaveBeenCalled()
    sendRequest(message)
    await Promise.resolve()
    expect(runtime).toHaveBeenCalledExactlyOnceWith(message)
    expect(window.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ response: { status: 'fallback' } }),
      origin
    )
  })
  it('cancels pending work and suppresses late responses', async () => {
    let finish: (result: unknown) => void = () => {}
    const runtime = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          })
      )
      .mockResolvedValue(undefined)
    cleanups.push(installPasskeyBridge(runtime))
    sendRequest(serializePasskeyRequest('create', options, 'request-1')!)
    receive({
      channel: passkeyChannel,
      source: passkeyPageSource,
      type: 'cancel',
      message: { kind: 'authierPasskeyCancel', requestId: 'request-1' }
    })
    finish({ status: 'fallback' })
    await Promise.resolve()
    expect(runtime).toHaveBeenLastCalledWith({
      kind: 'authierPasskeyCancel',
      requestId: 'request-1'
    })
    expect(window.postMessage).toHaveBeenCalledTimes(1)
  })
  it('falls back when the extension has disconnected', async () => {
    cleanups.push(
      installPasskeyBridge(vi.fn().mockRejectedValue(new Error('Disconnected')))
    )
    sendRequest(serializePasskeyRequest('create', options, 'request-1')!)
    await Promise.resolve()
    expect(window.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ response: { status: 'fallback' } }),
      origin
    )
  })
})

describe('WebAuthn page interception', () => {
  it('advertises platform verification only when the isolated provider is available', async () => {
    const nativeAvailable = vi.fn().mockResolvedValue(false)
    class TestPublicKeyCredential {
      static isUserVerifyingPlatformAuthenticatorAvailable = nativeAvailable
    }
    vi.stubGlobal('PublicKeyCredential', TestPublicKeyCredential)
    cleanups.push(installPasskeyPage())
    const capability =
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    const packet: unknown = vi.mocked(window.postMessage).mock.calls[0]?.[0]
    if (!isRecord(packet) || typeof packet.requestId !== 'string')
      throw new Error('Missing capability probe')
    respond(packet.requestId, undefined, 'available')
    await expect(capability).resolves.toBe(true)
    expect(nativeAvailable).not.toHaveBeenCalled()
    const nativeCapability =
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    await vi.advanceTimersByTimeAsync(500)
    await expect(nativeCapability).resolves.toBe(false)
    expect(nativeAvailable).toHaveBeenCalledOnce()
  })

  it('preserves native non-passkey requests and conditional mediation', async () => {
    cleanups.push(installPasskeyPage())
    const conditional: CredentialRequestOptions = {
      ...getOptions,
      mediation: 'conditional'
    }
    await navigator.credentials.create()
    await navigator.credentials.get(conditional)
    expect(nativeCreate).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(nativeGet).toHaveBeenCalledExactlyOnceWith(conditional)
    expect(window.postMessage).not.toHaveBeenCalled()
  })
  it('preserves native operation when Authier is unavailable or another provider was chosen', async () => {
    cleanups.push(installPasskeyPage())
    const unavailable = navigator.credentials.get(getOptions)
    await vi.advanceTimersByTimeAsync(500)
    await expect(unavailable).resolves.toBeNull()
    expect(nativeGet).toHaveBeenCalledExactlyOnceWith(getOptions)
    vi.mocked(window.postMessage).mockClear()
    const anotherProvider = navigator.credentials.create({
      publicKey: options
    })
    respond(latestRequest().requestId, { status: 'fallback' })
    await expect(anotherProvider).resolves.toBeNull()
    expect(nativeCreate).toHaveBeenCalledExactlyOnceWith({
      publicKey: options
    })
  })
  it('keeps acknowledged requests open until approval and propagates DOM errors', async () => {
    cleanups.push(installPasskeyPage())
    const result = navigator.credentials.get(getOptions)
    const expectation = expect(result).rejects.toMatchObject({
      name: 'NotAllowedError',
      message: 'Cancelled'
    })
    const { requestId } = latestRequest()
    respond(requestId, undefined, 'received')
    await vi.advanceTimersByTimeAsync(1000)
    expect(nativeGet).not.toHaveBeenCalled()
    respond(requestId, {
      status: 'error',
      name: 'NotAllowedError',
      message: 'Cancelled'
    })
    await expectation
  })
  it('honors already-aborted and newly aborted signals', async () => {
    cleanups.push(installPasskeyPage())
    const controller = new AbortController()
    const result = navigator.credentials.get({
      ...getOptions,
      signal: controller.signal
    })
    const expectation = expect(result).rejects.toMatchObject({
      name: 'AbortError'
    })
    controller.abort()
    await expectation
    expect(window.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'cancel' }),
      origin
    )
    await expect(
      navigator.credentials.get({ ...getOptions, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(nativeGet).not.toHaveBeenCalled()
  })
  it('enforces a requested timeout and cancels extension approval', async () => {
    cleanups.push(installPasskeyPage())
    const result = navigator.credentials.get({
      publicKey: { ...getOptions.publicKey!, timeout: 1000 }
    })
    const expectation = expect(result).rejects.toMatchObject({
      name: 'NotAllowedError'
    })
    respond(latestRequest().requestId, undefined, 'received')
    await vi.advanceTimersByTimeAsync(1000)
    await expectation
    expect(nativeGet).not.toHaveBeenCalled()
    expect(window.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'cancel' }),
      origin
    )
  })
  it('leaves insecure contexts untouched', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false
    })
    cleanups.push(installPasskeyPage())
    await navigator.credentials.get(getOptions)
    expect(nativeGet).toHaveBeenCalledExactlyOnceWith(getOptions)
    expect(window.postMessage).not.toHaveBeenCalled()
  })
})
