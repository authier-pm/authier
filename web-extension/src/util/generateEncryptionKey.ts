import { PBKDF2Iterations } from '@shared/constants'

/**
 * @returns string in base64
 */
export async function cryptoKeyToString(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return bufferToBase64(raw)
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

export const bufferToBase64 = (buff) =>
  btoa(
    Array.from(new Uint8Array(buff))
      .map((b) => String.fromCharCode(b))
      .join('')
  )

export const base64ToBuffer = (b64: string) =>
  //FIX: What is this
  //@ts-expect-error
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(null))

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

  return bufferToBase64(newBuff)
}

export async function decryptDeviceSecretWithPassword(
  plainPassword: string,
  lockedState: { encryptionSalt: string; authSecretEncrypted: string }
) {
  const masterEncryptionKey = await generateEncryptionKey(
    plainPassword,
    base64ToBuffer(lockedState.encryptionSalt)
  )

  const encryptedDataBuff = base64ToBuffer(lockedState.authSecretEncrypted)
  const iv = encryptedDataBuff.slice(16, 16 + 12)
  const data = encryptedDataBuff.slice(16 + 12)
  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterEncryptionKey,
      data
    )

    const addDeviceSecret = dec.decode(decryptedContent)
    return { addDeviceSecret, masterEncryptionKey }
  } catch (error) {
    console.log('error:', error)
    return { error: 'Wrong password' }
  }
}
