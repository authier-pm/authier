export const concatBytes = (
  ...parts: Uint8Array[]
): Uint8Array<ArrayBuffer> => {
  const result = new Uint8Array(
    parts.reduce((length, part) => length + part.length, 0)
  )
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

export const toBase64url = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const fromBase64url = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) {
    throw new TypeError('Invalid base64url data')
  }
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  if (toBase64url(bytes) !== value)
    throw new TypeError('Non-canonical base64url data')
  return bytes
}

type CborValue =
  | number
  | string
  | Uint8Array
  | ReadonlyMap<string | number, CborValue>

const cborHeader = (major: number, length: number): Uint8Array => {
  if (length < 24) return new Uint8Array([(major << 5) | length])
  if (length < 256) return new Uint8Array([(major << 5) | 24, length])
  if (length < 65536)
    return new Uint8Array([(major << 5) | 25, length >> 8, length & 255])
  throw new RangeError('CBOR value is too large')
}

/** The small definite-length CBOR subset used by COSE keys and none attestation. */
export const encodeCbor = (value: CborValue): Uint8Array<ArrayBuffer> => {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value))
      throw new TypeError('CBOR integers must be safe integers')
    if (value < 0) return concatBytes(cborHeader(1, -1 - value))
    return concatBytes(cborHeader(0, value))
  }
  if (typeof value === 'string') {
    const bytes = new TextEncoder().encode(value)
    return concatBytes(cborHeader(3, bytes.length), bytes)
  }
  if (value instanceof Uint8Array)
    return concatBytes(cborHeader(2, value.length), value)
  const entries = Array.from(value, ([key, entry]) =>
    concatBytes(encodeCbor(key), encodeCbor(entry))
  )
  return concatBytes(cborHeader(5, value.size), ...entries)
}

const encodeDerInteger = (value: Uint8Array): Uint8Array => {
  let first = 0
  while (first < value.length - 1 && value[first] === 0) first++
  const magnitude = value.slice(first)
  const positive =
    magnitude[0] & 0x80
      ? concatBytes(new Uint8Array([0]), magnitude)
      : magnitude
  return concatBytes(new Uint8Array([0x02, positive.length]), positive)
}

/** WebCrypto returns IEEE P1363 r || s; WebAuthn ES256 requires ASN.1 DER. */
export const es256SignatureToDer = (
  signature: Uint8Array
): Uint8Array<ArrayBuffer> => {
  if (signature.length !== 64)
    throw new TypeError('Expected a 64-byte ES256 signature')
  const integers = concatBytes(
    encodeDerInteger(signature.slice(0, 32)),
    encodeDerInteger(signature.slice(32))
  )
  return concatBytes(new Uint8Array([0x30, integers.length]), integers)
}
