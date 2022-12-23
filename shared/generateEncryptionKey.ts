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

export async function cryptoKeyToString(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return ab2str(raw)
}

export async function abToCryptoKey(raw: BufferSource) {
  const cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', true, [
    'decrypt',
    'encrypt'
  ])
  return cryptoKey
}
/*
Get some key material to use as input to the deriveKey method.
The key material is a password supplied by the user.
*/
async function getKeyMaterial(password: string) {
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
  // const decoder = new TextDecoder()
  // const decodedString = decoder.decode(buf)
  // return decodedString
  return String.fromCharCode.apply(null, new Uint16Array(buf))
}

export function str2Ab(str: string): BufferSource {
  // const enc = new TextEncoder()
  // return enc.encode(str)
  const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  const bufView = new Uint16Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export async function testGenerateEncryptionKey(psw: string, salt: string) {
  const keyMaterial = await getKeyMaterial(psw)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: str2Ab(salt),
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
