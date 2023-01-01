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
  return buff_to_base64(raw)
}

export async function abToCryptoKey(raw: BufferSource): Promise<CryptoKey> {
  const cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', true, [
    'decrypt',
    'encrypt'
  ])
  return cryptoKey
}

export const enc = new TextEncoder()
export const dec = new TextDecoder()
/**
 *
 *  Get some key material to use as input to the deriveKey method.
 *  The key material is a password supplied by the user.
 */
async function getKeyMaterial(password: string): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
}

export async function testGenerateEncryptionKey(
  psw: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(psw)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
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

export const buff_to_base64 = (buff: ArrayBuffer) =>
  btoa(
    new Uint8Array(buff).reduce(function (data, byte) {
      return data + String.fromCharCode(byte)
    }, '')
  )

export const base64_to_buf = (b64: string) =>
  //FIX: What is this
  //@ts-expect-error
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(null))

// export function ab2str(buf: ArrayBuffer): string {
//   return String.fromCharCode.apply(null, new Uint16Array(buf))
// }
//
//
// export function str2ab(str: string): ArrayBuffer {
//   const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
//   const bufView = new Uint16Array(buf)
//   for (let i = 0, strLen = str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i)
//   }
//   return buf
// }
