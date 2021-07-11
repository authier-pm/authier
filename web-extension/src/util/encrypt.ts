export async function AuthKey(salt: BufferSource, keyMaterial: CryptoKey) {
  let key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  return key
}

export async function VaultKey(
  //plaintext: BufferSource,
  salt: BufferSource,
  password: string
) {
  let enc = new TextEncoder()
  let keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  let key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  //let iv = window.crypto.getRandomValues(new Uint8Array(12))
  // return window.crypto.subtle.encrypt(
  //   {
  //     name: 'AES-GCM',
  //     iv: iv
  //   },
  //   key,
  //   plaintext
  // )

  return key
}
