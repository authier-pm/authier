import Base64 from './Base64'
import { TextEncoder, TextDecoder } from 'text-decoding'

const PBKDF2Iterations = 300000

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

export async function generateEncryptionKey(
  psw: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(psw)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2Iterations,
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
  Base64.btoa(
    Array.from(new Uint8Array(buff))
      .map((b) => String.fromCharCode(b))
      .join('')
  )

export const base64_to_buf = (b64: string) =>
  //FIX: What is this
  //@ts-expect-error
  Uint8Array.from(Base64.atob(b64), (c) => c.charCodeAt(null))

export const encryptedBuf_to_base64 = (
  encryptedBuff: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array
) => {
  const encryptedContentArr = new Uint8Array(encryptedBuff)
  const newBuff = new Uint8Array(
    salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
  )

  newBuff.set(salt, 0)
  newBuff.set(iv, salt.byteLength)
  newBuff.set(encryptedContentArr, salt.byteLength + iv.byteLength)

  return buff_to_base64(newBuff)
}
