import { describe, expect, it } from 'bun:test'
import vectors from './cryptoTestVectors.json'
import {
  abToCryptoKey,
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  decryptString,
  enc,
  encryptedBufToBase64,
  encryptString,
  generateEncryptionKey
} from './cryptoUtils'

describe('Android and WebCrypto encrypted vault compatibility', () => {
  for (const vector of vectors.vectors) {
    it(vector.id, async () => {
      const salt = base64ToBuffer(vector.salt)
      const key = await generateEncryptionKey(vector.password, salt)
      expect(bufferToBase64(enc.encode(vector.password))).toBe(
        vector.passwordUtf8
      )
      expect(await cryptoKeyToString(key)).toBe(vector.key)
      expect(await decryptString(key, vector.envelope)).toBe(vector.plaintext)

      const iv = base64ToBuffer(vector.iv)
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        enc.encode(vector.plaintext)
      )
      expect(encryptedBufToBase64(encrypted, iv, salt)).toBe(vector.envelope)
    })
  }

  it('uses fresh IVs for repeated plaintext and preserves UTF-8', async () => {
    const vector = vectors.vectors[1]!
    const key = await abToCryptoKey(base64ToBuffer(vector.key))
    const salt = base64ToBuffer(vector.salt)
    const first = await encryptString(key, vector.plaintext, salt)
    const second = await encryptString(key, vector.plaintext, salt)
    expect(first).not.toBe(second)
    expect(await decryptString(key, first)).toBe(vector.plaintext)
    expect(await decryptString(key, second)).toBe(vector.plaintext)
  })

  it('rejects a modified IV, ciphertext, authentication tag, and incorrect key', async () => {
    const vector = vectors.vectors[0]!
    const key = await abToCryptoKey(base64ToBuffer(vector.key))
    const original = base64ToBuffer(vector.envelope)
    for (const offset of [16, 28, original.length - 1]) {
      const modified = original.slice()
      modified[offset] = modified[offset]! ^ 1
      await expect(
        decryptString(key, bufferToBase64(modified))
      ).rejects.toThrow()
    }
    const wrongKey = await abToCryptoKey(new Uint8Array(32))
    await expect(decryptString(wrongKey, vector.envelope)).rejects.toThrow()
  })

  it('does not normalize composed and decomposed passwords', () => {
    expect(vectors.vectors[2]!.key).not.toBe(vectors.vectors[3]!.key)
  })
})
