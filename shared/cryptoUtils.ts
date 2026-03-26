const PBKDF2_ITERATIONS = 600_000

export const enc = new TextEncoder()
export const dec = new TextDecoder()

export async function cryptoKeyToString(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return bufferToBase64(raw)
}

export async function abToCryptoKey(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', true, [
    'decrypt',
    'encrypt'
  ])
}

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
}

export async function generateEncryptionKey(
  password: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(password)

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-512'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export const bufferToBase64 = (buffer: BufferSource): string =>
  btoa(
    Array.from(new Uint8Array(buffer as ArrayBufferLike))
      .map((value) => String.fromCharCode(value))
      .join('')
  )

export const base64ToBuffer = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64)
  const output = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index)
  }

  return output
}

export const encryptedBufToBase64 = (
  encryptedBuffer: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array
) => {
  const encryptedContent = new Uint8Array(encryptedBuffer)
  const output = new Uint8Array(
    salt.byteLength + iv.byteLength + encryptedContent.byteLength
  )

  output.set(salt, 0)
  output.set(iv, salt.byteLength)
  output.set(encryptedContent, salt.byteLength + iv.byteLength)

  return bufferToBase64(output)
}

export async function encryptString(
  key: CryptoKey,
  value: string,
  salt: Uint8Array
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(value)
  )

  return encryptedBufToBase64(encrypted, iv, salt)
}

export async function decryptString(
  key: CryptoKey,
  encryptedBase64: string
): Promise<string> {
  const encryptedData = base64ToBuffer(encryptedBase64)
  const iv = encryptedData.slice(16, 28)
  const data = encryptedData.slice(28)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return dec.decode(decrypted)
}

export function generateBackendSecret() {
  const parts = crypto.getRandomValues(new Uint32Array(8))

  return Array.from(parts, (part) => part.toString(36)).join('')
}

export async function initLocalDeviceAuthSecret(
  masterEncryptionKey: CryptoKey,
  salt: Uint8Array
) {
  const addDeviceSecret = generateBackendSecret()
  const addDeviceSecretEncrypted = await encryptString(
    masterEncryptionKey,
    addDeviceSecret,
    salt
  )

  return {
    addDeviceSecret,
    addDeviceSecretEncrypted
  }
}

export async function decryptDeviceSecretWithPassword(
  plainPassword: string,
  lockedState: { encryptionSalt: string; authSecretEncrypted: string }
) {
  const masterEncryptionKey = await generateEncryptionKey(
    plainPassword,
    base64ToBuffer(lockedState.encryptionSalt)
  )

  try {
    const addDeviceSecret = await decryptString(
      masterEncryptionKey,
      lockedState.authSecretEncrypted
    )

    return { addDeviceSecret, masterEncryptionKey }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Wrong password'
    }
  }
}
