import cryptoJS from 'crypto-js'

const PBKDF2Iterations = 10

export const generateEncryptionKey = (
  password: string,
  encryptionSalt: string
) =>
  cryptoJS
    .PBKDF2(password, encryptionSalt, {
      // TODO: make sure this uses crypto.subtle, seems like it does not
      iterations: PBKDF2Iterations, // TODO: make this customizable per user
      keySize: 128
    })
    .toString(cryptoJS.enc.Hex)

/**
 * @returns string in base64
 */
export async function cryptoKeyToString(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return strToBase64(ab2str(raw))
}

export async function abToCryptoKey(raw: BufferSource): Promise<CryptoKey> {
  const cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', true, [
    'decrypt',
    'encrypt'
  ])
  return cryptoKey
}
/*
 *
 *  Get some key material to use as input to the deriveKey method.
 *  The key material is a password supplied by the user.
 */
async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
}

export function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint16Array(buf))
}

export const base64ToStr = (str: string): string =>
  Buffer.from(str, 'base64').toString('binary')

export const strToBase64 = (str: string): string =>
  Buffer.from(str, 'binary').toString('base64')

export function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  const bufView = new Uint16Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export async function testGenerateEncryptionKey(
  psw: string,
  salt: string
): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(psw)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: str2ab(salt),
      iterations: 130000,
      hash: 'SHA-512'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  return key
}
