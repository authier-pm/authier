export interface IPasswordGeneratorConfig {
  numbers: boolean
  symbols: boolean
  uppercase: boolean
  lowercase: boolean
  length: number
}

export const defaultPasswordGeneratorConfig: IPasswordGeneratorConfig = {
  numbers: true,
  symbols: true,
  uppercase: true,
  lowercase: true,
  length: 14
}

interface CryptoLike {
  getRandomValues: (values: Uint32Array) => Uint32Array
}

const CHARSETS = {
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz'
} as const

const getWebCrypto = (): CryptoLike => {
  const crypto = (globalThis as typeof globalThis & { crypto?: CryptoLike }).crypto

  if (!crypto) {
    throw new Error(
      'Password generation requires globalThis.crypto.getRandomValues()'
    )
  }

  return crypto
}

const randomInt = (maxExclusive: number) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error(`Invalid random range: ${maxExclusive}`)
  }

  const crypto = getWebCrypto()
  const values = new Uint32Array(1)
  const maxUint32 = 0x100000000
  const limit = maxUint32 - (maxUint32 % maxExclusive)

  while (true) {
    crypto.getRandomValues(values)
    const value = values[0]

    if (value < limit) {
      return value % maxExclusive
    }
  }
}

export const generate = (config: IPasswordGeneratorConfig) => {
  const pools: string[] = []

  if (config.numbers) pools.push(CHARSETS.numbers)
  if (config.symbols) pools.push(CHARSETS.symbols)
  if (config.uppercase) pools.push(CHARSETS.uppercase)
  if (config.lowercase) pools.push(CHARSETS.lowercase)

  if (pools.length === 0) {
    throw new Error('At least one password character group must be enabled')
  }

  if (!Number.isInteger(config.length) || config.length <= 0) {
    throw new Error(`Invalid password length: ${config.length}`)
  }

  const alphabet = pools.join('')
  let password = ''

  for (let i = 0; i < config.length; i += 1) {
    password += alphabet[randomInt(alphabet.length)]
  }

  return password
}
