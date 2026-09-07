import { createPublicKey, verify, webcrypto } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { passkeySchema } from '@shared/passkeySchema'
import {
  concatBytes,
  es256SignatureToDer,
  fromBase64url,
  toBase64url
} from './encoding'
import {
  assertNoExcludedPasskey,
  createPasskey,
  creationOptionsSchema,
  getPasskeyAssertion,
  getUnsupportedPasskeyReason,
  passkeyMatchesRequest,
  requestOptionsSchema,
  validateRpId,
  type PasskeyCreationOptions
} from './webauthn'

const origin = 'https://login.example.com:8443'
const challenge = toBase64url(new Uint8Array(32).fill(42))
beforeAll(() => vi.stubGlobal('crypto', webcrypto))
afterAll(() => vi.unstubAllGlobals())
const creationOptions = (): PasskeyCreationOptions => ({
  challenge,
  rp: { id: 'example.com', name: 'Example' },
  user: {
    id: toBase64url(new Uint8Array([0, 255, 1, 200])),
    name: 'alex@example.com',
    displayName: 'Alex'
  },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  authenticatorSelection: {
    residentKey: 'required',
    userVerification: 'preferred'
  },
  extensions: { credProps: true }
})

const required = <T>(value: T | undefined): T => {
  if (value === undefined)
    throw new Error('Expected a credential response field')
  return value
}

type DecodedCbor =
  | number
  | string
  | Uint8Array
  | Map<string | number, DecodedCbor>

// A decoder independent of the authenticator encoder checks the wire format.
const decodeCbor = (bytes: Uint8Array): DecodedCbor => {
  let offset = 0
  const read = (): DecodedCbor => {
    const header = bytes[offset++]
    const major = header >> 5
    let length = header & 31
    if (length === 24) length = bytes[offset++]
    else if (length === 25) length = (bytes[offset++] << 8) | bytes[offset++]
    else if (length > 25) throw new Error('Unsupported CBOR length')
    if (major === 0) return length
    if (major === 1) return -1 - length
    if (major === 2 || major === 3) {
      const value = bytes.slice(offset, offset + length)
      offset += length
      return major === 2 ? value : new TextDecoder().decode(value)
    }
    if (major === 5) {
      const value = new Map<string | number, DecodedCbor>()
      for (let index = 0; index < length; index++) {
        const key = read()
        if (typeof key !== 'number' && typeof key !== 'string')
          throw new Error('Invalid CBOR key')
        value.set(key, read())
      }
      return value
    }
    throw new Error('Unsupported CBOR type')
  }
  const result = read()
  expect(offset).toBe(bytes.length)
  return result
}

const decodeDerSignature = (signature: Uint8Array): Uint8Array<ArrayBuffer> => {
  expect(signature[0]).toBe(0x30)
  expect(signature[1]).toBe(signature.length - 2)
  let offset = 2
  const result = new Uint8Array(64)
  for (let index = 0; index < 2; index++) {
    expect(signature[offset++]).toBe(0x02)
    const length = signature[offset++]
    let integer = signature.slice(offset, offset + length)
    offset += length
    if (integer.length === 33) {
      expect(integer[0]).toBe(0)
      integer = integer.slice(1)
    }
    result.set(integer, index * 32 + 32 - integer.length)
  }
  expect(offset).toBe(signature.length)
  return result
}

describe('passkey relying party scope', () => {
  it('accepts secure same-domain and parent-domain requests', () => {
    expect(validateRpId(undefined, origin)).toBe('login.example.com')
    expect(validateRpId('example.com', origin)).toBe('example.com')
    expect(validateRpId('login.example.com', origin)).toBe('login.example.com')
    expect(validateRpId('example.co.uk', 'https://login.example.co.uk')).toBe(
      'example.co.uk'
    )
    expect(
      validateRpId('tenant.github.io', 'https://login.tenant.github.io')
    ).toBe('tenant.github.io')
    expect(validateRpId(undefined, 'http://localhost:3000')).toBe('localhost')
  })

  it.each([
    ['example.com', 'https://evilexample.com'],
    ['example.com', 'https://example.com.evil.com'],
    ['other.example.com', origin],
    ['com', origin],
    ['co.uk', 'https://example.co.uk'],
    ['github.io', 'https://attacker.github.io'],
    ['example.com', 'http://example.com'],
    ['127.0.0.1', 'https://127.0.0.1'],
    ['[::1]', 'https://[::1]'],
    ['example.com:443', 'https://example.com'],
    ['example.com/path', 'https://example.com'],
    ['example.com@evil.com', 'https://example.com'],
    ['example.com.', 'https://example.com'],
    ['localhost', 'https://evil.localhost'],
    ['example.com', 'file:///example.com']
  ])('rejects RP ID %s from origin %s', (rpId, requestOrigin) => {
    expect(() => validateRpId(rpId, requestOrigin)).toThrowError(
      expect.objectContaining({ name: 'SecurityError' })
    )
  })
})

describe('software authenticator', () => {
  it('produces a resident ES256 credential with valid none attestation and COSE public key', async () => {
    const { passkey, credential } = await createPasskey(
      creationOptions(),
      origin,
      false
    )
    expect(passkeySchema.safeParse(passkey).success).toBe(true)
    expect(credential.id).toBe(passkey.credentialId)
    expect(credential.rawId).toBe(passkey.credentialId)
    expect(fromBase64url(credential.id)).toHaveLength(32)
    expect(credential.clientExtensionResults).toEqual({
      credProps: { rk: true }
    })
    expect(credential.response.transports).toEqual(['internal'])
    expect(credential.response.publicKeyAlgorithm).toBe(-7)
    expect(JSON.stringify(credential)).not.toContain(passkey.privateKeyJwk.d)

    const clientData = JSON.parse(
      new TextDecoder().decode(
        fromBase64url(credential.response.clientDataJSON)
      )
    )
    expect(clientData).toEqual({
      type: 'webauthn.create',
      challenge,
      origin,
      crossOrigin: false
    })
    const attestation = decodeCbor(
      fromBase64url(required(credential.response.attestationObject))
    )
    if (!(attestation instanceof Map))
      throw new Error('Expected attestation CBOR map')
    expect(attestation.get('fmt')).toBe('none')
    expect(attestation.get('attStmt')).toEqual(new Map())
    const authData = attestation.get('authData')
    if (!(authData instanceof Uint8Array))
      throw new Error('Expected authenticator bytes')
    expect(authData).toEqual(
      fromBase64url(credential.response.authenticatorData)
    )
    expect(authData.slice(0, 32)).toEqual(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode('example.com')
        )
      )
    )
    expect(authData[32]).toBe(0x59) // UP, BE, BS, AT; UV is absent.
    expect(authData.slice(33, 37)).toEqual(new Uint8Array(4))
    expect(authData.slice(37, 53)).toEqual(new Uint8Array(16))
    expect(authData.slice(53, 55)).toEqual(new Uint8Array([0, 32]))
    expect(authData.slice(55, 87)).toEqual(fromBase64url(passkey.credentialId))
    const cose = decodeCbor(authData.slice(87))
    if (!(cose instanceof Map)) throw new Error('Expected COSE map')
    expect(cose).toEqual(
      new Map<number, number | Uint8Array>([
        [1, 2],
        [3, -7],
        [-1, 1],
        [-2, fromBase64url(passkey.privateKeyJwk.x)],
        [-3, fromBase64url(passkey.privateKeyJwk.y)]
      ])
    )
  })

  it('signs an assertion with the same key after vault serialization into another browser', async () => {
    const { passkey, credential } = await createPasskey(
      creationOptions(),
      origin,
      true
    )
    const restored = passkeySchema.parse(JSON.parse(JSON.stringify(passkey)))
    const assertion = await getPasskeyAssertion(
      restored,
      { challenge, rpId: 'example.com' },
      'https://example.com',
      true
    )
    const authData = fromBase64url(assertion.response.authenticatorData)
    const clientData = fromBase64url(assertion.response.clientDataJSON)
    expect(authData[32]).toBe(0x1d) // UP, UV, BE, BS.
    expect(authData).toHaveLength(37)
    expect(authData.slice(33)).toEqual(new Uint8Array(4))
    expect(assertion.response.userHandle).toBe(passkey.userHandle)
    expect(JSON.parse(new TextDecoder().decode(clientData))).toEqual({
      type: 'webauthn.get',
      challenge,
      origin: 'https://example.com',
      crossOrigin: false
    })
    const signedData = concatBytes(
      authData,
      new Uint8Array(await crypto.subtle.digest('SHA-256', clientData))
    )
    const spki = fromBase64url(required(credential.response.publicKey))
    const signature = fromBase64url(required(assertion.response.signature))
    const key = await crypto.subtle.importKey(
      'spki',
      spki,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    )
    expect(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        decodeDerSignature(signature),
        signedData
      )
    ).toBe(true)
    const nodeKey = createPublicKey({
      key: Buffer.from(spki),
      format: 'der',
      type: 'spki'
    })
    expect(verify('sha256', signedData, nodeKey, signature)).toBe(true)
    const changedData = signedData.slice()
    changedData[0] ^= 1
    expect(verify('sha256', changedData, nodeKey, signature)).toBe(false)
  })

  it('requires explicit verification before setting UV and refuses required UV otherwise', async () => {
    const options = creationOptions()
    options.authenticatorSelection = { userVerification: 'required' }
    await expect(createPasskey(options, origin, false)).rejects.toMatchObject({
      name: 'NotAllowedError'
    })
    const { passkey, credential } = await createPasskey(options, origin, true)
    expect(fromBase64url(credential.response.authenticatorData)[32]).toBe(0x5d)
    await expect(
      getPasskeyAssertion(
        passkey,
        { challenge, rpId: 'example.com', userVerification: 'required' },
        origin,
        false
      )
    ).rejects.toMatchObject({ name: 'NotAllowedError' })
    const assertion = await getPasskeyAssertion(
      passkey,
      { challenge, rpId: 'example.com', userVerification: 'discouraged' },
      origin,
      false
    )
    expect(fromBase64url(assertion.response.authenticatorData)[32]).toBe(0x19)
  })

  it('matches discoverable credentials and allowCredentials only within the exact RP scope', async () => {
    const { passkey } = await createPasskey(creationOptions(), origin, true)
    expect(
      passkeyMatchesRequest(passkey, { challenge, rpId: 'example.com' }, origin)
    ).toBe(true)
    expect(
      passkeyMatchesRequest(
        passkey,
        { challenge, rpId: 'example.com', allowCredentials: [] },
        origin
      )
    ).toBe(true)
    expect(
      passkeyMatchesRequest(
        passkey,
        {
          challenge,
          rpId: 'example.com',
          allowCredentials: [
            {
              type: 'public-key',
              id: passkey.credentialId,
              transports: ['usb']
            }
          ]
        },
        origin
      )
    ).toBe(true)
    expect(passkeyMatchesRequest(passkey, { challenge }, origin)).toBe(false)
    expect(
      passkeyMatchesRequest(
        passkey,
        {
          challenge,
          rpId: 'example.com',
          allowCredentials: [{ type: 'public-key', id: 'another-key' }]
        },
        origin
      )
    ).toBe(false)
    await expect(
      getPasskeyAssertion(
        passkey,
        { challenge, rpId: 'evil.com' },
        'https://evil.com',
        true
      )
    ).rejects.toMatchObject({ name: 'NotAllowedError' })
    await expect(
      getPasskeyAssertion(
        passkey,
        { challenge, rpId: 'example.com' },
        'https://evil.com',
        true
      )
    ).rejects.toMatchObject({ name: 'SecurityError' })
  })

  it('prevents duplicate excluded registrations without leaking keys from another RP', async () => {
    const options = creationOptions()
    const { passkey } = await createPasskey(options, origin, true)
    options.excludeCredentials = [
      { type: 'public-key', id: passkey.credentialId }
    ]
    expect(() =>
      assertNoExcludedPasskey([passkey], options, origin)
    ).toThrowError(expect.objectContaining({ name: 'InvalidStateError' }))
    expect(() =>
      assertNoExcludedPasskey(
        [{ ...passkey, rpId: 'other.com' }],
        options,
        origin
      )
    ).not.toThrow()
    expect(() => assertNoExcludedPasskey([], options, origin)).not.toThrow()
  })

  it('uses default ES256 parameters when the algorithm list is empty', async () => {
    const options = creationOptions()
    options.pubKeyCredParams = []
    expect(
      (await createPasskey(options, origin, true)).credential.response
        .publicKeyAlgorithm
    ).toBe(-7)
  })

  it('rejects algorithms and mandatory features that need a native authenticator', async () => {
    const unsupported = creationOptions()
    unsupported.pubKeyCredParams = [{ type: 'public-key', alg: -257 }]
    await expect(
      createPasskey(unsupported, origin, true)
    ).rejects.toMatchObject({ name: 'NotSupportedError' })
    expect(
      getUnsupportedPasskeyReason(
        {
          ...creationOptions(),
          authenticatorSelection: { authenticatorAttachment: 'cross-platform' }
        },
        'create'
      )
    ).toBeTruthy()
    expect(
      getUnsupportedPasskeyReason(
        { ...creationOptions(), attestation: 'enterprise' },
        'create'
      )
    ).toBeTruthy()
    for (const extensions of [
      { prf: {} },
      { largeBlob: { support: 'required' } },
      { appid: 'https://example.com' },
      { enforceCredentialProtectionPolicy: true }
    ]) {
      expect(
        getUnsupportedPasskeyReason({ challenge, extensions }, 'get')
      ).toBeTruthy()
    }
    expect(getUnsupportedPasskeyReason(creationOptions(), 'create')).toBeNull()
  })

  it('rejects malformed and oversized inputs at the background boundary', async () => {
    expect(creationOptionsSchema.safeParse(creationOptions()).success).toBe(
      true
    )
    expect(requestOptionsSchema.safeParse({ challenge }).success).toBe(true)
    expect(
      creationOptionsSchema.safeParse({
        ...creationOptions(),
        user: { ...creationOptions().user, id: 'x'.repeat(87) }
      }).success
    ).toBe(false)
    expect(
      requestOptionsSchema.safeParse({ challenge: 'a'.repeat(90000) }).success
    ).toBe(false)
    expect(
      requestOptionsSchema.safeParse({
        challenge,
        allowCredentials: Array(129).fill({ type: 'public-key', id: 'AA' })
      }).success
    ).toBe(false)
    await expect(
      createPasskey({ ...creationOptions(), challenge: 'A' }, origin, true)
    ).rejects.toThrow('base64url')
    await expect(
      createPasskey(
        {
          ...creationOptions(),
          user: {
            ...creationOptions().user,
            id: toBase64url(new Uint8Array(65))
          }
        },
        origin,
        true
      )
    ).rejects.toThrow('1 to 64 bytes')
  })
})

describe('WebAuthn binary encoding', () => {
  it('encodes DER integers minimally and adds a sign byte for high bits', () => {
    const signature = new Uint8Array(64)
    signature[31] = 1
    signature[32] = 128
    const der = es256SignatureToDer(signature)
    expect(Array.from(der.slice(0, 8))).toEqual([0x30, 38, 2, 1, 1, 2, 33, 0])
    expect(decodeDerSignature(der)).toEqual(signature)
  })

  it('roundtrips binary user IDs and rejects ambiguous base64 encodings', () => {
    const data = new Uint8Array([0, 255, 254, 65, 128])
    expect(fromBase64url(toBase64url(data))).toEqual(data)
    for (const invalid of ['AA==', 'A+', 'A/', 'A', 'AB', 'A A'])
      expect(() => fromBase64url(invalid)).toThrow()
  })
})
