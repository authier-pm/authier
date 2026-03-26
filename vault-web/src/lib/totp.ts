import { generateSync } from 'otplib'

type TotpOptions = {
  secret: string
  digits: number
  period: number
  now?: number
}

export const formatTotpToken = (token: string) => token.match(/.{1,3}/g)?.join(' ') ?? token

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const normalizeBase32Secret = (secret: string) =>
  secret.toUpperCase().replace(/[\s=-]/g, '')

const decodeBase32Secret = (secret: string): Uint8Array | null => {
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

const generateTotpTokenManually = async ({
  secret,
  digits,
  period,
  now
}: Required<TotpOptions>): Promise<string | null> => {
  const secretBytes = decodeBase32Secret(secret)

  if (secretBytes === null) {
    return null
  }

  const counter = Math.floor(Math.floor(now / 1000) / period)
  const normalizedSecretBytes = secretBytes.slice()
  const key = await crypto.subtle.importKey(
    'raw',
    normalizedSecretBytes,
    {
      name: 'HMAC',
      hash: 'SHA-1'
    },
    false,
    ['sign']
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encodeCounter(counter))
  )
  const offset = signature[signature.length - 1] & 0x0f
  const binaryCode =
    ((signature[offset] & 0x7f) << 24) |
    (signature[offset + 1] << 16) |
    (signature[offset + 2] << 8) |
    signature[offset + 3]

  return (binaryCode % 10 ** digits).toString().padStart(digits, '0')
}

export const getTotpRemainingSeconds = (
  period: number,
  now = Date.now()
) => {
  if (!Number.isInteger(period) || period <= 0) {
    return 0
  }

  const elapsedSeconds = Math.floor(now / 1000) % period
  return period - elapsedSeconds
}

export const generateTotpToken = async ({
  secret,
  digits,
  period,
  now = Date.now()
}: TotpOptions): Promise<string | null> => {
  if (!Number.isInteger(digits) || digits <= 0) {
    return null
  }

  if (!Number.isInteger(period) || period <= 0) {
    return null
  }

  try {
    return generateSync({
      secret,
      digits,
      period,
      epoch: Math.floor(now / 1000)
    })
  } catch {
    return generateTotpTokenManually({
      secret,
      digits,
      period,
      now
    })
  }
}
