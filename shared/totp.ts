import { generateSync } from 'otplib'

export type TotpOptions = {
  secret: string
  digits?: number
  period?: number
  now?: number
}

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const minHmacSecretByteLength = 16

export const normalizeBase32Secret = (secret: string) =>
  secret.toUpperCase().replace(/[\s=-]/g, '')

export const decodeBase32Secret = (secret: string): Uint8Array | null => {
  const normalizedSecret = normalizeBase32Secret(secret)

  if (!normalizedSecret) {
    return null
  }

  let value = 0
  let bits = 0
  const bytes: number[] = []

  for (const character of normalizedSecret) {
    const characterIndex = base32Alphabet.indexOf(character)

    if (characterIndex === -1) {
      return null
    }

    value = (value << 5) | characterIndex
    bits += 5

    while (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 0xff)
      value &= (1 << bits) - 1
    }
  }

  return new Uint8Array(bytes)
}

const encodeCounter = (counter: number) => {
  const bytes = new Uint8Array(8)
  let remaining = BigInt(counter)

  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 0xffn)
    remaining >>= 8n
  }

  return bytes
}

const normalizeLegacyHmacKey = (secretBytes: Uint8Array) => {
  if (secretBytes.length >= minHmacSecretByteLength) {
    return secretBytes
  }

  const paddedSecretBytes = new Uint8Array(minHmacSecretByteLength)
  paddedSecretBytes.set(secretBytes)

  return paddedSecretBytes
}

const rotateLeft = (value: number, bits: number) =>
  (value << bits) | (value >>> (32 - bits))

const sha1 = (message: Uint8Array) => {
  const bitLength = message.length * 8
  const paddedLength = Math.ceil((message.length + 9) / 64) * 64
  const paddedMessage = new Uint8Array(paddedLength)
  paddedMessage.set(message)
  paddedMessage[message.length] = 0x80

  const view = new DataView(paddedMessage.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 2 ** 32))
  view.setUint32(paddedLength - 4, bitLength)

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const words = new Uint32Array(80)

  for (let chunkOffset = 0; chunkOffset < paddedLength; chunkOffset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(chunkOffset + index * 4)
    }

    for (let index = 16; index < 80; index += 1) {
      words[index] = rotateLeft(
        words[index - 3] ^
          words[index - 8] ^
          words[index - 14] ^
          words[index - 16],
        1
      )
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let index = 0; index < 80; index += 1) {
      let f = 0
      let k = 0

      if (index < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (index < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }

      const temp = (rotateLeft(a, 5) + f + e + k + words[index]) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30) >>> 0
      b = a
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  const hash = new Uint8Array(20)
  const hashView = new DataView(hash.buffer)
  hashView.setUint32(0, h0)
  hashView.setUint32(4, h1)
  hashView.setUint32(8, h2)
  hashView.setUint32(12, h3)
  hashView.setUint32(16, h4)

  return hash
}

const hmacSha1 = (key: Uint8Array, message: Uint8Array) => {
  const blockSize = 64
  const normalizedKey = new Uint8Array(blockSize)
  const blockKey = key.length > blockSize ? sha1(key) : key
  normalizedKey.set(blockKey)

  const outerPad = new Uint8Array(blockSize)
  const innerPad = new Uint8Array(blockSize)

  for (let index = 0; index < blockSize; index += 1) {
    outerPad[index] = normalizedKey[index] ^ 0x5c
    innerPad[index] = normalizedKey[index] ^ 0x36
  }

  const innerMessage = new Uint8Array(innerPad.length + message.length)
  innerMessage.set(innerPad)
  innerMessage.set(message, innerPad.length)

  const innerHash = sha1(innerMessage)
  const outerMessage = new Uint8Array(outerPad.length + innerHash.length)
  outerMessage.set(outerPad)
  outerMessage.set(innerHash, outerPad.length)

  return sha1(outerMessage)
}

const generateLegacyTotpToken = ({
  secret,
  digits,
  period,
  now
}: Required<TotpOptions>): string | null => {
  const secretBytes = decodeBase32Secret(secret)

  if (secretBytes === null) {
    return null
  }

  const counter = Math.floor(Math.round(now / 1000.0) / period)
  const signature = hmacSha1(
    normalizeLegacyHmacKey(secretBytes),
    encodeCounter(counter)
  )
  const offset = signature[signature.length - 1] & 0x0f
  const binaryCode =
    ((signature[offset] & 0x7f) << 24) |
    (signature[offset + 1] << 16) |
    (signature[offset + 2] << 8) |
    signature[offset + 3]

  return (binaryCode % 10 ** digits).toString().padStart(digits, '0')
}

export const generateTotpToken = async ({
  secret,
  digits = 6,
  period = 30,
  now = Date.now()
}: TotpOptions): Promise<string | null> => {
  if (!Number.isInteger(digits) || digits <= 0) {
    return null
  }

  if (!Number.isInteger(period) || period <= 0) {
    return null
  }

  const secretBytes = decodeBase32Secret(secret)

  if (secretBytes === null) {
    return null
  }

  if (secretBytes.length < minHmacSecretByteLength) {
    return generateLegacyTotpToken({
      secret,
      digits,
      period,
      now
    })
  }

  return generateSync({
    secret,
    digits,
    period,
    epoch: Math.floor(now / 1000)
  })
}

export const generateTotpTokenSync = ({
  secret,
  digits = 6,
  period = 30,
  now = Date.now()
}: TotpOptions) => {
  if (!Number.isInteger(digits) || digits <= 0) {
    return null
  }

  if (!Number.isInteger(period) || period <= 0) {
    return null
  }

  const secretBytes = decodeBase32Secret(secret)

  if (secretBytes === null) {
    return null
  }

  if (secretBytes.length < minHmacSecretByteLength) {
    return generateLegacyTotpToken({
      secret,
      digits,
      period,
      now
    })
  }

  return generateSync({
    secret,
    digits,
    period,
    epoch: Math.floor(now / 1000)
  })
}
