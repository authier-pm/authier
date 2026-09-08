import { writeFile } from 'node:fs/promises'
import {
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  enc,
  encryptedBufToBase64,
  generateEncryptionKey
} from './cryptoUtils'

// Public test data only. Fixed IVs MUST NOT be used when encrypting real vaults.
const inputs = [
  {
    id: 'ascii-login',
    password: 'correct horse battery staple',
    salt: 'AAECAwQFBgcICQoLDA0ODw==',
    iv: 'EBESExQVFhcYGRob',
    plaintext:
      '{"label":"Example","url":"https://example.com","username":"alice@example.com","password":"demo-only","iconUrl":null,"androidUri":null,"iosUri":null}'
  },
  {
    id: 'unicode-password-and-payload',
    password: 'Příliš žluťoučký kůň 🔐 密碼',
    salt: '8PHy8/T19vf4+fr7/P3+/w==',
    iv: 'ICEiIyQlJicoKSor',
    plaintext:
      '{"label":"Osobní účet 🔐","url":null,"secret":"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ","digits":8,"period":30,"iconUrl":null}'
  },
  {
    id: 'composed-password-empty-plaintext',
    password: 'café-master-password',
    salt: 'AAECAwQFBgcICQoLDA0ODw==',
    iv: 'MDEyMzQ1Njc4OTo7',
    plaintext: ''
  },
  {
    id: 'decomposed-password',
    password: 'cafe\u0301-master-password',
    salt: 'AAECAwQFBgcICQoLDA0ODw==',
    iv: 'QEFCQ0RFRkdISUpL',
    plaintext: 'Enrollment-secret-demo-only\n\u0000'
  }
]

const vectors = await Promise.all(
  inputs.map(async (input) => {
    const salt = base64ToBuffer(input.salt)
    const iv = base64ToBuffer(input.iv)
    const key = await generateEncryptionKey(input.password, salt)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      enc.encode(input.plaintext)
    )
    return {
      ...input,
      passwordUtf8: bufferToBase64(enc.encode(input.password)),
      key: await cryptoKeyToString(key),
      envelope: encryptedBufToBase64(encrypted, iv, salt)
    }
  })
)

await writeFile(
  new URL('./cryptoTestVectors.json', import.meta.url),
  `${JSON.stringify(
    {
      format: 'authier-aes-gcm-v1',
      kdf: 'PBKDF2-HMAC-SHA512',
      iterations: 600_000,
      keyBytes: 32,
      saltBytes: 16,
      ivBytes: 12,
      tagBytes: 16,
      vectors
    },
    null,
    2
  )}\n`
)
