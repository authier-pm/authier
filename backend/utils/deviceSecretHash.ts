import { timingSafeEqual } from 'node:crypto'

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'

const iterations = 600_000
// Hosted Workers cap native PBKDF2 calls at 100,000 iterations (including node:crypto).
// Retain the verifier format/work factor with a portable fallback for that specific limit.
// https://github.com/cloudflare/workerd/issues/1346
const deriveVerifier = async (
  secret: string,
  salt: Uint8Array<ArrayBuffer>
) => {
  const password = new TextEncoder().encode(secret)
  const key = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, [
    'deriveBits'
  ])
  const bits = await crypto.subtle
    .deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
    .then((bits) => new Uint8Array(bits))
    .catch((error: unknown) => {
      if (
        !(error instanceof Error) ||
        error.name !== 'NotSupportedError' ||
        !error.message.includes('iteration')
      )
        throw error
      return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: 32 })
    })
  return Buffer.from(bits)
}

export const hashDeviceSecret = async (secret: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(secret, salt)
  return `pbkdf2-sha256:${iterations}:${Buffer.from(salt).toString('hex')}:${verifier.toString('hex')}`
}

export const verifyDeviceSecret = async (secret: string, verifier: string) => {
  // Existing credentials are one-way hashed by the SQL migration and rotated
  // to the salted format on the next successful device login/password change.
  if (/^[a-f0-9]{64}$/.test(verifier)) {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(secret)
    )
    return timingSafeEqual(
      new Uint8Array(digest),
      new Uint8Array(Buffer.from(verifier, 'hex'))
    )
  }
  const match = /^pbkdf2-sha256:600000:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(
    verifier
  )
  if (!match) return false
  const digest = await deriveVerifier(
    secret,
    new Uint8Array(Buffer.from(match[1], 'hex'))
  )
  return timingSafeEqual(
    new Uint8Array(digest),
    new Uint8Array(Buffer.from(match[2], 'hex'))
  )
}
